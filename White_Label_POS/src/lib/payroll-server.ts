import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import {
  staffUsers,
  employeeSalaryProfiles,
  attendanceRecords,
  leaveRequests,
  branches,
  payrollRuns,
  payrollItems,
} from "@/server/db/schema";
import { eq, and, desc, sql, count, gte, lte, like, inArray } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";
import { logAuditAction } from "@/lib/audit-logger";

async function resolvePayrollTenantContext() {
  const res = await getSessionServerFn();
  if (!res.success || !res.session) {
    throw new Error("Unauthorized");
  }
  if (res.session.role !== "Head Office Admin" && res.session.role !== "Super Admin") {
    throw new Error("Unauthorized: Access restricted to Head Office Admin");
  }
  return { tenantId: res.session.tenantId!, userId: res.session.id };
}

export const getStaffSalaryProfilesFn = createServerFn({ method: "POST" })
  .validator((d: { branchId?: string; search?: string } | undefined) => d || {})
  .handler(async ({ data }) => {
    const { tenantId } = await resolvePayrollTenantContext();

    const conditions = [eq(staffUsers.tenantId, tenantId)];
    if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(staffUsers.branchId, data.branchId));
    }

    const rows = await db
      .select({
        staffId: staffUsers.id,
        name: staffUsers.name,
        email: staffUsers.email,
        phone: staffUsers.phone,
        role: staffUsers.role,
        isActive: staffUsers.isActive,
        createdAt: staffUsers.createdAt,
        branchId: staffUsers.branchId,
        branchName: branches.name,
        profileId: employeeSalaryProfiles.id,
        basicSalary: employeeSalaryProfiles.basicSalary,
        housingAllowance: employeeSalaryProfiles.housingAllowance,
        transportAllowance: employeeSalaryProfiles.transportAllowance,
        otherAllowances: employeeSalaryProfiles.otherAllowances,
        standardDeductions: employeeSalaryProfiles.standardDeductions,
        paymentFrequency: employeeSalaryProfiles.paymentFrequency,
        currency: employeeSalaryProfiles.currency,
        bankName: employeeSalaryProfiles.bankName,
        iban: employeeSalaryProfiles.iban,
        joinDate: employeeSalaryProfiles.joinDate,
        updatedAt: employeeSalaryProfiles.updatedAt,
      })
      .from(staffUsers)
      .leftJoin(branches, eq(staffUsers.branchId, branches.id))
      .leftJoin(
        employeeSalaryProfiles,
        eq(staffUsers.id, employeeSalaryProfiles.staffUserId)
      )
      .where(and(...conditions))
      .orderBy(staffUsers.name);

    const staffProfiles = rows.map((r) => {
      const basic = Number(r.basicSalary ?? 0);
      const housing = Number(r.housingAllowance ?? 0);
      const transport = Number(r.transportAllowance ?? 0);
      const other = Number(r.otherAllowances ?? 0);
      const deductions = Number(r.standardDeductions ?? 0);
      const totalAllowances = housing + transport + other;
      const grossSalary = basic + totalAllowances;
      const netEstimated = Math.max(0, grossSalary - deductions);

      return {
        staffId: r.staffId,
        name: r.name || "Unnamed Staff",
        email: r.email,
        phone: r.phone || "",
        role: r.role,
        isActive: r.isActive,
        createdAt: r.createdAt ? r.createdAt.toISOString() : null,
        branchId: r.branchId,
        branchName: r.branchName || "Unassigned",
        profileId: r.profileId,
        hasProfile: !!r.profileId,
        basicSalary: basic,
        housingAllowance: housing,
        transportAllowance: transport,
        otherAllowances: other,
        standardDeductions: deductions,
        totalAllowances,
        grossSalary,
        netEstimated,
        paymentFrequency: r.paymentFrequency || "monthly",
        currency: r.currency || "AED",
        bankName: r.bankName || "",
        iban: r.iban || "",
        joinDate: r.joinDate ? String(r.joinDate) : null,
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
      };
    });

    return {
      success: true,
      staffProfiles,
    };
  });

export const upsertSalaryProfileFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      staffUserId: string;
      basicSalary: number | string;
      housingAllowance?: number | string;
      transportAllowance?: number | string;
      otherAllowances?: number | string;
      standardDeductions?: number | string;
      paymentFrequency?: string;
      currency?: string;
      bankName?: string | null;
      iban?: string | null;
      joinDate?: string | null;
    }) => d
  )
  .handler(async ({ data }) => {
    const { tenantId } = await resolvePayrollTenantContext();

    const staff = await db.query.staffUsers.findFirst({
      where: and(
        eq(staffUsers.id, data.staffUserId),
        eq(staffUsers.tenantId, tenantId)
      ),
    });
    if (!staff) {
      throw new Error("Staff member not found or does not belong to your organization.");
    }

    const basicSalaryStr = Number(data.basicSalary || 0).toFixed(2);
    const housingAllowanceStr = Number(data.housingAllowance || 0).toFixed(2);
    const transportAllowanceStr = Number(data.transportAllowance || 0).toFixed(2);
    const otherAllowancesStr = Number(data.otherAllowances || 0).toFixed(2);
    const standardDeductionsStr = Number(data.standardDeductions || 0).toFixed(2);
    const paymentFrequency = data.paymentFrequency || "monthly";
    const currency = data.currency || "AED";
    const bankName = data.bankName ? data.bankName.trim() : null;
    const iban = data.iban ? data.iban.trim().toUpperCase() : null;
    const joinDate = data.joinDate ? data.joinDate.trim() : null;

    const existing = await db.query.employeeSalaryProfiles.findFirst({
      where: and(
        eq(employeeSalaryProfiles.tenantId, tenantId),
        eq(employeeSalaryProfiles.staffUserId, data.staffUserId)
      ),
    });

    let result;
    if (existing) {
      const [updated] = await db
        .update(employeeSalaryProfiles)
        .set({
          basicSalary: basicSalaryStr,
          housingAllowance: housingAllowanceStr,
          transportAllowance: transportAllowanceStr,
          otherAllowances: otherAllowancesStr,
          standardDeductions: standardDeductionsStr,
          paymentFrequency,
          currency,
          bankName,
          iban,
          joinDate,
          updatedAt: new Date(),
        })
        .where(eq(employeeSalaryProfiles.id, existing.id))
        .returning();
      result = updated;
    } else {
      const [inserted] = await db
        .insert(employeeSalaryProfiles)
        .values({
          tenantId,
          staffUserId: data.staffUserId,
          basicSalary: basicSalaryStr,
          housingAllowance: housingAllowanceStr,
          transportAllowance: transportAllowanceStr,
          otherAllowances: otherAllowancesStr,
          standardDeductions: standardDeductionsStr,
          paymentFrequency,
          currency,
          bankName,
          iban,
          joinDate,
        })
        .returning();
      result = inserted;
    }

    try {
      await logAuditAction({
        action: existing ? "Update Salary Profile" : "Create Salary Profile",
        entityType: "salary_profile",
        entityId: result.id,
        summary: `Updated salary profile for ${staff.name}: Basic AED ${basicSalaryStr}`,
      });
    } catch {
      // non-blocking
    }

    return { success: true, profile: result };
  });

export const getMySalaryProfileFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || !res.session.id) {
      throw new Error("Unauthorized: Please log in to view your salary profile.");
    }

    // Security: Extract user ID ONLY from the verified server session cookie
    const userId = res.session.id;

    const staff = await db.query.staffUsers.findFirst({
      where: eq(staffUsers.id, userId),
      with: {
        branch: true,
      },
    });

    if (!staff) {
      throw new Error("Employee account not found.");
    }

    const profile = await db.query.employeeSalaryProfiles.findFirst({
      where: eq(employeeSalaryProfiles.staffUserId, userId),
    });

    const basic = Number(profile?.basicSalary ?? 0);
    const housing = Number(profile?.housingAllowance ?? 0);
    const transport = Number(profile?.transportAllowance ?? 0);
    const other = Number(profile?.otherAllowances ?? 0);
    const deductions = Number(profile?.standardDeductions ?? 0);
    const totalAllowances = housing + transport + other;
    const grossSalary = basic + totalAllowances;
    const netEstimated = Math.max(0, grossSalary - deductions);

    const rawIban = (profile?.iban || "").trim();
    const maskedIban = rawIban
      ? rawIban.length > 4
        ? `••••••••••••${rawIban.slice(-4)}`
        : rawIban
      : null;

    return {
      success: true,
      hasProfile: !!profile,
      employee: {
        id: staff.id,
        name: staff.name || "Employee",
        email: staff.email,
        phone: staff.phone || "",
        role: staff.role,
        branchName: staff.branch?.name || "Unassigned",
        joinDate: profile?.joinDate ? String(profile.joinDate) : null,
      },
      salary: profile
        ? {
            basicSalary: basic,
            housingAllowance: housing,
            transportAllowance: transport,
            otherAllowances: other,
            totalAllowances,
            grossSalary,
            standardDeductions: deductions,
            netEstimated,
            paymentFrequency: profile.paymentFrequency || "monthly",
            currency: profile.currency || "AED",
            bankName: profile.bankName || "Not configured",
            maskedIban,
            joinDate: profile.joinDate ? String(profile.joinDate) : null,
            updatedAt: profile.updatedAt ? profile.updatedAt.toISOString() : null,
          }
        : null,
    };
  });

async function resolveAttendanceAccessContext() {
  const res = await getSessionServerFn();
  if (!res.success || !res.session) {
    throw new Error("Unauthorized");
  }
  const role = res.session.role;
  if (role !== "Head Office Admin" && role !== "Super Admin" && role !== "Branch Manager") {
    throw new Error("Unauthorized: Access restricted to Management");
  }
  return {
    tenantId: res.session.tenantId!,
    userId: res.session.id,
    role,
    userBranchId: res.session.branchId ?? null,
  };
}

export const getAttendanceForDateFn = createServerFn({ method: "POST" })
  .validator((d: { date: string; branchId?: string } | undefined) => d || { date: new Date().toISOString().slice(0, 10) })
  .handler(async ({ data }) => {
    const { tenantId, role, userBranchId } = await resolveAttendanceAccessContext();

    const targetDate = (data.date || new Date().toISOString().slice(0, 10)).trim();

    const conditions = [eq(staffUsers.tenantId, tenantId), eq(staffUsers.isActive, true)];

    if (role === "Branch Manager" && userBranchId) {
      conditions.push(eq(staffUsers.branchId, userBranchId));
    } else if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(staffUsers.branchId, data.branchId));
    }

    const rows = await db
      .select({
        staffId: staffUsers.id,
        name: staffUsers.name,
        email: staffUsers.email,
        phone: staffUsers.phone,
        role: staffUsers.role,
        branchId: staffUsers.branchId,
        branchName: branches.name,
        attendanceId: attendanceRecords.id,
        status: attendanceRecords.status,
        hoursWorked: attendanceRecords.hoursWorked,
        notes: attendanceRecords.notes,
        markedBy: attendanceRecords.markedBy,
        updatedAt: attendanceRecords.updatedAt,
      })
      .from(staffUsers)
      .leftJoin(branches, eq(staffUsers.branchId, branches.id))
      .leftJoin(
        attendanceRecords,
        and(
          eq(staffUsers.id, attendanceRecords.staffUserId),
          eq(attendanceRecords.date, targetDate)
        )
      )
      .where(and(...conditions))
      .orderBy(staffUsers.name);

    let presentCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;
    let onLeaveCount = 0;
    let restDayCount = 0;
    let publicHolidayCount = 0;
    let unmarkedCount = 0;

    const roster = rows.map((r) => {
      const status = r.status || "unmarked";
      if (status === "present") presentCount++;
      else if (status === "absent") absentCount++;
      else if (status === "half_day") halfDayCount++;
      else if (status === "on_leave") onLeaveCount++;
      else if (status === "rest_day") restDayCount++;
      else if (status === "public_holiday") publicHolidayCount++;
      else unmarkedCount++;

      const defaultHours = status === "half_day" ? 4 : status === "present" ? 8 : 0;
      const hours = r.hoursWorked !== null && r.hoursWorked !== undefined ? Number(r.hoursWorked) : defaultHours;

      return {
        staffId: r.staffId,
        name: r.name || "Unnamed Staff",
        email: r.email,
        phone: r.phone || "",
        role: r.role,
        branchId: r.branchId,
        branchName: r.branchName || "Unassigned",
        attendanceId: r.attendanceId,
        status,
        hoursWorked: hours,
        notes: r.notes || "",
        markedBy: r.markedBy,
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
      };
    });

    return {
      success: true,
      date: targetDate,
      summary: {
        totalStaff: roster.length,
        present: presentCount,
        absent: absentCount,
        halfDay: halfDayCount,
        onLeave: onLeaveCount,
        restDay: restDayCount,
        publicHoliday: publicHolidayCount,
        unmarked: unmarkedCount,
      },
      roster,
    };
  });

export const markAttendanceFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      staffUserId: string;
      date: string;
      status: string;
      hoursWorked?: number | string;
      notes?: string | null;
    }) => d
  )
  .handler(async ({ data }) => {
    const { tenantId, userId, role, userBranchId } = await resolveAttendanceAccessContext();

    const staff = await db.query.staffUsers.findFirst({
      where: and(
        eq(staffUsers.id, data.staffUserId),
        eq(staffUsers.tenantId, tenantId)
      ),
    });

    if (!staff) {
      throw new Error("Staff member not found or does not belong to this organization.");
    }

    if (role === "Branch Manager" && userBranchId && staff.branchId !== userBranchId) {
      throw new Error("Unauthorized: You can only mark attendance for staff in your branch.");
    }

    const targetDate = (data.date || new Date().toISOString().slice(0, 10)).trim();
    const status = data.status || "present";
    const notes = data.notes !== undefined ? (data.notes ? data.notes.trim() : null) : null;

    let hours = data.hoursWorked !== undefined && data.hoursWorked !== null && data.hoursWorked !== ""
      ? Number(data.hoursWorked)
      : (status === "half_day" ? 4 : status === "present" ? 8 : 0);
    if (isNaN(hours) || hours < 0) hours = 0;
    const hoursWorkedStr = hours.toFixed(2);

    const existing = await db.query.attendanceRecords.findFirst({
      where: and(
        eq(attendanceRecords.tenantId, tenantId),
        eq(attendanceRecords.staffUserId, data.staffUserId),
        eq(attendanceRecords.date, targetDate)
      ),
    });

    let record;
    if (status === "unmarked") {
      if (existing) {
        await db.delete(attendanceRecords).where(eq(attendanceRecords.id, existing.id));
      }
      return { success: true, status: "unmarked", record: null };
    }

    if (existing) {
      const [updated] = await db
        .update(attendanceRecords)
        .set({
          branchId: staff.branchId,
          status,
          hoursWorked: hoursWorkedStr,
          notes,
          markedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(attendanceRecords.id, existing.id))
        .returning();
      record = updated;
    } else {
      const [inserted] = await db
        .insert(attendanceRecords)
        .values({
          tenantId,
          branchId: staff.branchId,
          staffUserId: data.staffUserId,
          date: targetDate,
          status,
          hoursWorked: hoursWorkedStr,
          notes,
          markedBy: userId,
        })
        .returning();
      record = inserted;
    }

    return { success: true, record };
  });

export const bulkMarkPresentFn = createServerFn({ method: "POST" })
  .validator((d: { date: string; branchId?: string } | undefined) => d || { date: new Date().toISOString().slice(0, 10) })
  .handler(async ({ data }) => {
    const { tenantId, userId, role, userBranchId } = await resolveAttendanceAccessContext();

    const targetDate = (data.date || new Date().toISOString().slice(0, 10)).trim();

    const conditions = [eq(staffUsers.tenantId, tenantId), eq(staffUsers.isActive, true)];
    if (role === "Branch Manager" && userBranchId) {
      conditions.push(eq(staffUsers.branchId, userBranchId));
    } else if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(staffUsers.branchId, data.branchId));
    }

    const staffList = await db.query.staffUsers.findMany({
      where: and(...conditions),
    });

    if (staffList.length === 0) {
      return { success: true, markedCount: 0 };
    }

    for (const staff of staffList) {
      const existing = await db.query.attendanceRecords.findFirst({
        where: and(
          eq(attendanceRecords.tenantId, tenantId),
          eq(attendanceRecords.staffUserId, staff.id),
          eq(attendanceRecords.date, targetDate)
        ),
      });

      if (existing) {
        await db
          .update(attendanceRecords)
          .set({
            branchId: staff.branchId,
            status: "present",
            hoursWorked: "8.00",
            markedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(attendanceRecords.id, existing.id));
      } else {
        await db.insert(attendanceRecords).values({
          tenantId,
          branchId: staff.branchId,
          staffUserId: staff.id,
          date: targetDate,
          status: "present",
          hoursWorked: "8.00",
          markedBy: userId,
        });
      }
    }

    try {
      await logAuditAction({
        action: "Bulk Mark Attendance",
        entityType: "attendance_records",
        entityId: targetDate,
        summary: `Marked all ${staffList.length} staff as present for date ${targetDate}`,
      });
    } catch {}

    return { success: true, markedCount: staffList.length };
  });

// ==========================================
// LEAVE MANAGEMENT SERVER FUNCTIONS (PHASE 3)
// ==========================================

// 1. Employee submits their own leave request (IDOR-safe: userId from session only)
export const submitLeaveRequestFn = createServerFn({ method: "POST" })
  .validator((d: { leaveType: string; startDate: string; endDate: string; reason?: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || !res.session.id) {
      throw new Error("Unauthorized: Please sign in to submit a leave request.");
    }

    const tenantId = res.session.tenantId!;
    const userId = res.session.id;

    const validTypes = ["annual", "sick", "unpaid", "emergency", "maternity_paternity"];
    if (!validTypes.includes(data.leaveType)) {
      throw new Error("Invalid leave type specified.");
    }

    const start = new Date(`${data.startDate.trim()}T00:00:00Z`);
    const end = new Date(`${data.endDate.trim()}T00:00:00Z`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end date format.");
    }

    if (end < start) {
      throw new Error("End date cannot be earlier than start date.");
    }

    const diffTime = end.getTime() - start.getTime();
    const daysCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const isPaid = data.leaveType !== "unpaid";

    const [inserted] = await db
      .insert(leaveRequests)
      .values({
        tenantId,
        staffUserId: userId,
        leaveType: data.leaveType,
        isPaid,
        startDate: data.startDate.trim(),
        endDate: data.endDate.trim(),
        daysCount,
        reason: data.reason?.trim() || null,
        status: "pending",
      })
      .returning();

    try {
      await logAuditAction({
        action: "Submitted Leave Request",
        entityType: "leave_requests",
        entityId: inserted.id,
        summary: `${res.session.name} submitted ${data.leaveType} leave request for ${daysCount} day(s) from ${data.startDate} to ${data.endDate}`,
      });
    } catch {}

    return {
      success: true,
      leaveRequestId: inserted.id,
      daysCount,
      isPaid,
    };
  });

// 2. Employee gets their own leave request history (session only with pagination)
export const getMyLeaveRequestsFn = createServerFn({ method: "POST" })
  .validator((d: { page?: number; limit?: number } | undefined) => d || {})
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || !res.session.id) {
      throw new Error("Unauthorized: Please sign in.");
    }

    const tenantId = res.session.tenantId!;
    const userId = res.session.id;
    const page = Math.max(1, data.page || 1);
    const limit = Math.max(1, Math.min(100, data.limit || 10));
    const offset = (page - 1) * limit;

    const whereConditions = and(
      eq(leaveRequests.tenantId, tenantId),
      eq(leaveRequests.staffUserId, userId)
    );

    const [countRes] = await db
      .select({ total: count() })
      .from(leaveRequests)
      .where(whereConditions);

    const total = Number(countRes?.total || 0);

    const rows = await db
      .select({
        id: leaveRequests.id,
        leaveType: leaveRequests.leaveType,
        isPaid: leaveRequests.isPaid,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        daysCount: leaveRequests.daysCount,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        approvedAt: leaveRequests.approvedAt,
        createdAt: leaveRequests.createdAt,
        approverName: staffUsers.name,
      })
      .from(leaveRequests)
      .leftJoin(staffUsers, eq(leaveRequests.approvedBy, staffUsers.id))
      .where(whereConditions)
      .orderBy(desc(leaveRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      leaveRequests: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt ? r.createdAt.toISOString() : null,
        approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  });

// 3. Employee updates their own pending leave request
export const updateLeaveRequestFn = createServerFn({ method: "POST" })
  .validator(
    (d: {
      leaveRequestId: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      reason?: string;
    }) => d
  )
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || !res.session.id) {
      throw new Error("Unauthorized: Please sign in.");
    }

    const tenantId = res.session.tenantId!;
    const userId = res.session.id;

    const existing = await db.query.leaveRequests.findFirst({
      where: and(
        eq(leaveRequests.id, data.leaveRequestId),
        eq(leaveRequests.tenantId, tenantId)
      ),
    });

    if (!existing) {
      throw new Error("Leave request not found.");
    }

    if (existing.staffUserId !== userId) {
      throw new Error("Unauthorized: You can only edit your own leave requests.");
    }

    if (existing.status !== "pending") {
      throw new Error(
        `Cannot edit a leave request that has already been ${existing.status}.`
      );
    }

    const validTypes = ["annual", "sick", "unpaid", "emergency", "maternity_paternity"];
    if (!validTypes.includes(data.leaveType)) {
      throw new Error("Invalid leave type specified.");
    }

    const start = new Date(`${data.startDate.trim()}T00:00:00Z`);
    const end = new Date(`${data.endDate.trim()}T00:00:00Z`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid start or end date format.");
    }

    if (end < start) {
      throw new Error("End date cannot be earlier than start date.");
    }

    const diffTime = end.getTime() - start.getTime();
    const daysCount = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const isPaid = data.leaveType !== "unpaid";

    const [updated] = await db
      .update(leaveRequests)
      .set({
        leaveType: data.leaveType,
        isPaid,
        startDate: data.startDate.trim(),
        endDate: data.endDate.trim(),
        daysCount,
        reason: data.reason?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, data.leaveRequestId))
      .returning();

    try {
      await logAuditAction({
        action: "Updated Leave Request",
        entityType: "leave_requests",
        entityId: updated.id,
        summary: `${res.session.name} updated pending ${data.leaveType} leave request (${data.startDate} to ${data.endDate})`,
      });
    } catch {}

    return {
      success: true,
      leaveRequest: updated,
    };
  });

// 4. Employee deletes their own pending leave request
export const deleteMyLeaveRequestFn = createServerFn({ method: "POST" })
  .validator((d: { leaveRequestId: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || !res.session.id) {
      throw new Error("Unauthorized: Please sign in.");
    }

    const tenantId = res.session.tenantId!;
    const userId = res.session.id;

    const existing = await db.query.leaveRequests.findFirst({
      where: and(
        eq(leaveRequests.id, data.leaveRequestId),
        eq(leaveRequests.tenantId, tenantId)
      ),
    });

    if (!existing) {
      throw new Error("Leave request not found.");
    }

    if (existing.staffUserId !== userId) {
      throw new Error("Unauthorized: You can only delete your own leave requests.");
    }

    if (existing.status !== "pending") {
      throw new Error(
        `Cannot delete a leave request that has already been ${existing.status}.`
      );
    }

    await db.delete(leaveRequests).where(eq(leaveRequests.id, data.leaveRequestId));

    try {
      await logAuditAction({
        action: "Deleted Leave Request",
        entityType: "leave_requests",
        entityId: data.leaveRequestId,
        summary: `${res.session.name} deleted their pending leave request (${existing.startDate} to ${existing.endDate})`,
      });
    } catch {}

    return {
      success: true,
      message: "Leave request deleted successfully.",
    };
  });

// 5. Admin / Branch Manager view: list pending (or all) leave requests scoped to tenant / branch with pagination
export const getPendingLeaveRequestsFn = createServerFn({ method: "POST" })
  .validator((d: { branchId?: string; status?: string; page?: number; limit?: number } | undefined) => d || {})
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) {
      throw new Error("Unauthorized: Session required.");
    }

    const role = res.session.role;
    const isHeadOffice = role === "Head Office Admin" || role === "Super Admin";
    const isBranchManager = role === "Branch Manager";

    if (!isHeadOffice && !isBranchManager) {
      throw new Error("Unauthorized: Access restricted to Head Office Admin and Branch Managers.");
    }

    const tenantId = res.session.tenantId!;
    const userBranchId = res.session.branchId;
    const page = Math.max(1, data.page || 1);
    const limit = Math.max(1, Math.min(100, data.limit || 10));
    const offset = (page - 1) * limit;

    const conditions = [eq(leaveRequests.tenantId, tenantId)];

    // Role-based branch scoping
    if (isBranchManager && userBranchId) {
      conditions.push(eq(staffUsers.branchId, userBranchId));
    } else if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(staffUsers.branchId, data.branchId));
    }

    // Status filter
    if (data.status && data.status !== "all") {
      conditions.push(eq(leaveRequests.status, data.status));
    }

    const whereClause = and(...conditions);

    const [countRes] = await db
      .select({ total: count() })
      .from(leaveRequests)
      .innerJoin(staffUsers, eq(leaveRequests.staffUserId, staffUsers.id))
      .where(whereClause);

    const total = Number(countRes?.total || 0);

    const rows = await db
      .select({
        id: leaveRequests.id,
        leaveType: leaveRequests.leaveType,
        isPaid: leaveRequests.isPaid,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        daysCount: leaveRequests.daysCount,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        approvedAt: leaveRequests.approvedAt,
        createdAt: leaveRequests.createdAt,
        staffId: leaveRequests.staffUserId,
        staffName: staffUsers.name,
        staffEmail: staffUsers.email,
        staffPhone: staffUsers.phone,
        staffRole: staffUsers.role,
        branchId: staffUsers.branchId,
        branchName: branches.name,
      })
      .from(leaveRequests)
      .innerJoin(staffUsers, eq(leaveRequests.staffUserId, staffUsers.id))
      .leftJoin(branches, eq(staffUsers.branchId, branches.id))
      .where(whereClause)
      .orderBy(desc(leaveRequests.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      leaveRequests: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt ? r.createdAt.toISOString() : null,
        approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  });

// 6. Admin / Branch Manager: Approve or Reject a leave request.
// On APPROVAL: automatically upserts attendance_records for each date with status = 'on_leave'.
export const approveOrRejectLeaveFn = createServerFn({ method: "POST" })
  .validator((d: { leaveRequestId: string; decision: "approved" | "rejected"; remarks?: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) {
      throw new Error("Unauthorized: Session required.");
    }

    const role = res.session.role;
    const isHeadOffice = role === "Head Office Admin" || role === "Super Admin";
    const isBranchManager = role === "Branch Manager";

    if (!isHeadOffice && !isBranchManager) {
      throw new Error("Unauthorized: Access restricted to Head Office Admin and Branch Managers.");
    }

    const tenantId = res.session.tenantId!;
    const userId = res.session.id;

    if (data.decision !== "approved" && data.decision !== "rejected") {
      throw new Error("Decision must be either 'approved' or 'rejected'.");
    }

    const existing = await db.query.leaveRequests.findFirst({
      where: and(
        eq(leaveRequests.id, data.leaveRequestId),
        eq(leaveRequests.tenantId, tenantId)
      ),
    });

    if (!existing) {
      throw new Error("Leave request not found.");
    }

    // Branch manager can only approve leaves for staff in their branch
    if (isBranchManager && res.session.branchId) {
      const staff = await db.query.staffUsers.findFirst({
        where: eq(staffUsers.id, existing.staffUserId),
      });
      if (!staff || staff.branchId !== res.session.branchId) {
        throw new Error("Unauthorized: You can only approve leaves for employees in your own branch.");
      }
    }

    // Update leave request status
    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: data.decision,
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, data.leaveRequestId))
      .returning();

    // ON APPROVAL: automatically sync attendance roster for the entire date range
    if (data.decision === "approved") {
      const staff = await db.query.staffUsers.findFirst({
        where: eq(staffUsers.id, existing.staffUserId),
      });

      const branchId = staff?.branchId || null;
      const start = new Date(`${existing.startDate}T00:00:00Z`);
      const end = new Date(`${existing.endDate}T00:00:00Z`);

      const curr = new Date(start);
      while (curr <= end) {
        const dateStr = curr.toISOString().slice(0, 10);

        const existingRecord = await db.query.attendanceRecords.findFirst({
          where: and(
            eq(attendanceRecords.tenantId, tenantId),
            eq(attendanceRecords.staffUserId, existing.staffUserId),
            eq(attendanceRecords.date, dateStr)
          ),
        });

        const leaveNote = `Approved Leave (${existing.leaveType.replace(/_/g, " ")})`;

        if (existingRecord) {
          await db
            .update(attendanceRecords)
            .set({
              branchId,
              status: "on_leave",
              hoursWorked: "0.00",
              notes: leaveNote,
              markedBy: userId,
              updatedAt: new Date(),
            })
            .where(eq(attendanceRecords.id, existingRecord.id));
        } else {
          await db.insert(attendanceRecords).values({
            tenantId,
            branchId,
            staffUserId: existing.staffUserId,
            date: dateStr,
            status: "on_leave",
            hoursWorked: "0.00",
            notes: leaveNote,
            markedBy: userId,
          });
        }

        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    }

    try {
      await logAuditAction({
        action: `${data.decision === "approved" ? "Approved" : "Rejected"} Leave Request`,
        entityType: "leave_requests",
        entityId: data.leaveRequestId,
        summary: `${res.session.name} ${data.decision} leave request for staff ID ${existing.staffUserId} (${existing.startDate} to ${existing.endDate})`,
      });
    } catch {}

    return { success: true, decision: data.decision, leaveRequest: updated };
  });

// 7. Head Office Admin deletes an approved or rejected leave request
// If approved: also cleans up auto-marked attendance entries for the leave range
export const deleteLeaveRequestFn = createServerFn({ method: "POST" })
  .validator((d: { leaveRequestId: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) {
      throw new Error("Unauthorized: Session required.");
    }

    const role = res.session.role;
    const isHeadOffice = role === "Head Office Admin" || role === "Super Admin";
    if (!isHeadOffice) {
      throw new Error("Unauthorized: Access restricted to Head Office Admin.");
    }

    const tenantId = res.session.tenantId!;

    const existing = await db.query.leaveRequests.findFirst({
      where: and(
        eq(leaveRequests.id, data.leaveRequestId),
        eq(leaveRequests.tenantId, tenantId)
      ),
    });

    if (!existing) {
      throw new Error("Leave request not found.");
    }

    if (existing.status === "pending") {
      throw new Error(
        "Pending leave requests cannot be deleted directly by admin. Please approve or reject the request first, or the employee may delete their pending request."
      );
    }

    // If approved, cleanup corresponding auto-created attendance records
    if (existing.status === "approved") {
      await db
        .delete(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.tenantId, tenantId),
            eq(attendanceRecords.staffUserId, existing.staffUserId),
            gte(attendanceRecords.date, existing.startDate),
            lte(attendanceRecords.date, existing.endDate),
            eq(attendanceRecords.status, "on_leave"),
            like(attendanceRecords.notes, "%Approved Leave%")
          )
        );
    }

    await db.delete(leaveRequests).where(eq(leaveRequests.id, data.leaveRequestId));

    try {
      await logAuditAction({
        action: "Admin Deleted Leave Request",
        entityType: "leave_requests",
        entityId: data.leaveRequestId,
        summary: `${res.session.name} deleted ${existing.status} leave request for staff ID ${existing.staffUserId} (${existing.startDate} to ${existing.endDate})`,
      });
    } catch {}

    return {
      success: true,
      message: "Leave request deleted successfully.",
    };
  });

// ====================================================
// SALARY CALCULATION ENGINE & PAYROLL RUNS (PHASE 4)
// ====================================================

interface CalculatedPayrollItemData {
  staffUserId: string;
  basicSalary: string;
  totalAllowances: string;
  grossSalary: string;
  unpaidDays: number;
  unpaidDeduction: string;
  standardDeductions: string;
  netSalary: string;
  notes: string | null;
}

async function computePayrollRunItems(
  tenantId: string,
  month: string,
  branchId: string | null
): Promise<{
  items: CalculatedPayrollItemData[];
  totalGross: string;
  totalDeductions: string;
  totalNet: string;
}> {
  // 1. Calculate month date bounds
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10);
  if (isNaN(year) || isNaN(m) || m < 1 || m > 12) {
    throw new Error("Invalid month format. Expected 'YYYY-MM'.");
  }

  const monthStart = `${yearStr}-${monthStr.padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, m, 0).getDate();
  const monthEnd = `${yearStr}-${monthStr.padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  // 2. Fetch active staff who have configured salary profiles within scope
  const staffConditions = [
    eq(staffUsers.tenantId, tenantId),
    eq(staffUsers.isActive, true),
  ];
  if (branchId) {
    staffConditions.push(eq(staffUsers.branchId, branchId));
  }

  const eligibleStaff = await db
    .select({
      staffId: staffUsers.id,
      name: staffUsers.name,
      branchId: staffUsers.branchId,
      basicSalary: employeeSalaryProfiles.basicSalary,
      housingAllowance: employeeSalaryProfiles.housingAllowance,
      transportAllowance: employeeSalaryProfiles.transportAllowance,
      otherAllowances: employeeSalaryProfiles.otherAllowances,
      standardDeductions: employeeSalaryProfiles.standardDeductions,
    })
    .from(staffUsers)
    .innerJoin(
      employeeSalaryProfiles,
      eq(staffUsers.id, employeeSalaryProfiles.staffUserId)
    )
    .where(and(...staffConditions))
    .orderBy(staffUsers.name);

  if (eligibleStaff.length === 0) {
    throw new Error(
      "No active staff with configured salary profiles found for the selected branch/scope."
    );
  }

  const staffIds = eligibleStaff.map((s) => s.staffId);

  // 3. Batch query approved unpaid leave requests overlapping with this month
  const unpaidLeaves = await db
    .select({
      staffUserId: leaveRequests.staffUserId,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
    })
    .from(leaveRequests)
    .where(
      and(
        eq(leaveRequests.tenantId, tenantId),
        eq(leaveRequests.status, "approved"),
        eq(leaveRequests.leaveType, "unpaid"),
        lte(leaveRequests.startDate, monthEnd),
        gte(leaveRequests.endDate, monthStart),
        inArray(leaveRequests.staffUserId, staffIds)
      )
    );

  // 4. Batch query absent attendance records within this month
  const absentRecords = await db
    .select({
      staffUserId: attendanceRecords.staffUserId,
      date: attendanceRecords.date,
    })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.tenantId, tenantId),
        eq(attendanceRecords.status, "absent"),
        gte(attendanceRecords.date, monthStart),
        lte(attendanceRecords.date, monthEnd),
        inArray(attendanceRecords.staffUserId, staffIds)
      )
    );

  // 5. Compute figures per employee
  let grandGross = 0;
  let grandDeductions = 0;
  let grandNet = 0;

  const items: CalculatedPayrollItemData[] = [];

  for (const staff of eligibleStaff) {
    const basic = Number(staff.basicSalary ?? 0);
    const housing = Number(staff.housingAllowance ?? 0);
    const transport = Number(staff.transportAllowance ?? 0);
    const other = Number(staff.otherAllowances ?? 0);
    const stdDeductions = Number(staff.standardDeductions ?? 0);

    const totalAllowances = housing + transport + other;
    const grossSalary = basic + totalAllowances;
    const perDayRate = grossSalary / 30;

    // Calculate unpaid leave days overlapping within month
    const staffLeaves = unpaidLeaves.filter((l) => l.staffUserId === staff.staffId);
    let unpaidLeaveDays = 0;
    for (const l of staffLeaves) {
      const overlapStart = l.startDate < monthStart ? monthStart : l.startDate;
      const overlapEnd = l.endDate > monthEnd ? monthEnd : l.endDate;
      const d1 = new Date(`${overlapStart}T00:00:00Z`);
      const d2 = new Date(`${overlapEnd}T00:00:00Z`);
      const days = Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      unpaidLeaveDays += days;
    }

    // Calculate absent days
    const staffAbsences = absentRecords.filter((a) => a.staffUserId === staff.staffId);
    const absentDays = staffAbsences.length;

    const totalUnpaidDays = unpaidLeaveDays + absentDays;
    const unpaidDeduction = Math.round(perDayRate * totalUnpaidDays * 100) / 100;
    const totalEmployeeDeductions = unpaidDeduction + stdDeductions;
    const netSalary = Math.max(0, Math.round((grossSalary - totalEmployeeDeductions) * 100) / 100);

    grandGross += grossSalary;
    grandDeductions += totalEmployeeDeductions;
    grandNet += netSalary;

    let notes = "";
    if (unpaidLeaveDays > 0 && absentDays > 0) {
      notes = `${unpaidLeaveDays} unpaid leave day(s), ${absentDays} unexcused absent day(s)`;
    } else if (unpaidLeaveDays > 0) {
      notes = `${unpaidLeaveDays} unpaid leave day(s)`;
    } else if (absentDays > 0) {
      notes = `${absentDays} unexcused absent day(s)`;
    }

    items.push({
      staffUserId: staff.staffId,
      basicSalary: basic.toFixed(2),
      totalAllowances: totalAllowances.toFixed(2),
      grossSalary: grossSalary.toFixed(2),
      unpaidDays: totalUnpaidDays,
      unpaidDeduction: unpaidDeduction.toFixed(2),
      standardDeductions: stdDeductions.toFixed(2),
      netSalary: netSalary.toFixed(2),
      notes: notes || null,
    });
  }

  return {
    items,
    totalGross: grandGross.toFixed(2),
    totalDeductions: grandDeductions.toFixed(2),
    totalNet: grandNet.toFixed(2),
  };
}

// 1. Generate a new Payroll Run (Draft status)
export const generatePayrollRunFn = createServerFn({ method: "POST" })
  .validator((d: { month: string; branchId?: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, userId } = await resolvePayrollTenantContext();

    const month = (data.month || "").trim();
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error("Invalid month format. Please select a valid month (YYYY-MM).");
    }

    const branchId = data.branchId && data.branchId !== "all" ? data.branchId.trim() : null;

    // Check for existing run for this tenant + branch scope + month
    const existingConditions = [
      eq(payrollRuns.tenantId, tenantId),
      eq(payrollRuns.month, month),
    ];
    if (branchId) {
      existingConditions.push(eq(payrollRuns.branchId, branchId));
    } else {
      existingConditions.push(sql`${payrollRuns.branchId} IS NULL`);
    }

    const existingRun = await db.query.payrollRuns.findFirst({
      where: and(...existingConditions),
    });

    if (existingRun) {
      throw new Error(
        `A payroll run for ${month} (${branchId ? "selected branch" : "all branches"}) already exists with status '${existingRun.status}'. Please view, regenerate, or delete the existing run.`
      );
    }

    // Compute calculations
    const computed = await computePayrollRunItems(tenantId, month, branchId);

    // Insert payroll run
    const [insertedRun] = await db
      .insert(payrollRuns)
      .values({
        tenantId,
        branchId,
        month,
        status: "Draft",
        totalGross: computed.totalGross,
        totalDeductions: computed.totalDeductions,
        totalNet: computed.totalNet,
        generatedBy: userId,
      })
      .returning();

    // Insert all itemized rows
    await db.insert(payrollItems).values(
      computed.items.map((item) => ({
        payrollRunId: insertedRun.id,
        staffUserId: item.staffUserId,
        basicSalary: item.basicSalary,
        totalAllowances: item.totalAllowances,
        grossSalary: item.grossSalary,
        unpaidDays: item.unpaidDays,
        unpaidDeduction: item.unpaidDeduction,
        standardDeductions: item.standardDeductions,
        netSalary: item.netSalary,
        notes: item.notes,
      }))
    );

    try {
      await logAuditAction({
        action: "Generate Payroll Run",
        entityType: "payroll_runs",
        entityId: insertedRun.id,
        summary: `Generated Draft payroll run for ${month} (${branchId ? "Branch " + branchId : "All Branches"}) totaling Gross AED ${computed.totalGross}, Net AED ${computed.totalNet}`,
      });
    } catch {}

    return {
      success: true,
      payrollRunId: insertedRun.id,
      totalNet: computed.totalNet,
      itemCount: computed.items.length,
    };
  });

// 2. Regenerate Draft Payroll Run (Draft only)
export const regenerateDraftPayrollRunFn = createServerFn({ method: "POST" })
  .validator((d: { payrollRunId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, userId } = await resolvePayrollTenantContext();

    const existingRun = await db.query.payrollRuns.findFirst({
      where: and(
        eq(payrollRuns.id, data.payrollRunId),
        eq(payrollRuns.tenantId, tenantId)
      ),
    });

    if (!existingRun) {
      throw new Error("Payroll run not found.");
    }

    if (existingRun.status !== "Draft") {
      throw new Error(
        `Cannot regenerate a payroll run with status '${existingRun.status}'. Figures are locked once Approved or Paid.`
      );
    }

    // Recompute
    const computed = await computePayrollRunItems(
      tenantId,
      existingRun.month,
      existingRun.branchId
    );

    // Replace items
    await db.delete(payrollItems).where(eq(payrollItems.payrollRunId, existingRun.id));

    await db.insert(payrollItems).values(
      computed.items.map((item) => ({
        payrollRunId: existingRun.id,
        staffUserId: item.staffUserId,
        basicSalary: item.basicSalary,
        totalAllowances: item.totalAllowances,
        grossSalary: item.grossSalary,
        unpaidDays: item.unpaidDays,
        unpaidDeduction: item.unpaidDeduction,
        standardDeductions: item.standardDeductions,
        netSalary: item.netSalary,
        notes: item.notes,
      }))
    );

    // Update run totals
    const [updatedRun] = await db
      .update(payrollRuns)
      .set({
        totalGross: computed.totalGross,
        totalDeductions: computed.totalDeductions,
        totalNet: computed.totalNet,
        generatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(payrollRuns.id, existingRun.id))
      .returning();

    try {
      await logAuditAction({
        action: "Regenerate Payroll Run",
        entityType: "payroll_runs",
        entityId: existingRun.id,
        summary: `Recalculated Draft payroll run for ${existingRun.month} totaling Gross AED ${computed.totalGross}, Net AED ${computed.totalNet}`,
      });
    } catch {}

    return {
      success: true,
      payrollRun: updatedRun,
      totalNet: computed.totalNet,
      itemCount: computed.items.length,
    };
  });

// 3. List Payroll Runs with Summary Totals
export const getPayrollRunsFn = createServerFn({ method: "POST" })
  .validator((d: { branchId?: string; status?: string } | undefined) => d || {})
  .handler(async ({ data }) => {
    const { tenantId } = await resolvePayrollTenantContext();

    const conditions = [eq(payrollRuns.tenantId, tenantId)];
    if (data.branchId && data.branchId !== "all") {
      conditions.push(eq(payrollRuns.branchId, data.branchId));
    }
    if (data.status && data.status !== "all") {
      conditions.push(eq(payrollRuns.status, data.status));
    }

    const rows = await db
      .select({
        id: payrollRuns.id,
        tenantId: payrollRuns.tenantId,
        branchId: payrollRuns.branchId,
        branchName: branches.name,
        month: payrollRuns.month,
        status: payrollRuns.status,
        totalGross: payrollRuns.totalGross,
        totalDeductions: payrollRuns.totalDeductions,
        totalNet: payrollRuns.totalNet,
        generatedBy: payrollRuns.generatedBy,
        generatedByName: sql<string | null>`gen.name`,
        generatedAt: payrollRuns.generatedAt,
        approvedBy: payrollRuns.approvedBy,
        approvedByName: sql<string | null>`app.name`,
        approvedAt: payrollRuns.approvedAt,
        paidAt: payrollRuns.paidAt,
        createdAt: payrollRuns.createdAt,
      })
      .from(payrollRuns)
      .leftJoin(branches, eq(payrollRuns.branchId, branches.id))
      .leftJoin(sql`staff_users AS gen`, sql`${payrollRuns.generatedBy} = gen.id`)
      .leftJoin(sql`staff_users AS app`, sql`${payrollRuns.approvedBy} = app.id`)
      .where(and(...conditions))
      .orderBy(desc(payrollRuns.month), desc(payrollRuns.createdAt));

    const runs = rows.map((r) => ({
      id: r.id,
      branchId: r.branchId,
      branchName: r.branchName || "All Branches",
      month: r.month,
      status: r.status,
      totalGross: Number(r.totalGross ?? 0),
      totalDeductions: Number(r.totalDeductions ?? 0),
      totalNet: Number(r.totalNet ?? 0),
      generatedByName: r.generatedByName || "System",
      generatedAt: r.generatedAt ? r.generatedAt.toISOString() : null,
      approvedByName: r.approvedByName || null,
      approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
      paidAt: r.paidAt ? r.paidAt.toISOString() : null,
      createdAt: r.createdAt ? r.createdAt.toISOString() : null,
    }));

    return {
      success: true,
      runs,
    };
  });

// 4. Get Itemized Details of a Single Payroll Run
export const getPayrollRunDetailFn = createServerFn({ method: "POST" })
  .validator((d: { payrollRunId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId } = await resolvePayrollTenantContext();

    const [runHeader] = await db
      .select({
        id: payrollRuns.id,
        tenantId: payrollRuns.tenantId,
        branchId: payrollRuns.branchId,
        branchName: branches.name,
        month: payrollRuns.month,
        status: payrollRuns.status,
        totalGross: payrollRuns.totalGross,
        totalDeductions: payrollRuns.totalDeductions,
        totalNet: payrollRuns.totalNet,
        generatedBy: payrollRuns.generatedBy,
        generatedByName: sql<string | null>`gen.name`,
        generatedAt: payrollRuns.generatedAt,
        approvedBy: payrollRuns.approvedBy,
        approvedByName: sql<string | null>`app.name`,
        approvedAt: payrollRuns.approvedAt,
        paidAt: payrollRuns.paidAt,
        createdAt: payrollRuns.createdAt,
      })
      .from(payrollRuns)
      .leftJoin(branches, eq(payrollRuns.branchId, branches.id))
      .leftJoin(sql`staff_users AS gen`, sql`${payrollRuns.generatedBy} = gen.id`)
      .leftJoin(sql`staff_users AS app`, sql`${payrollRuns.approvedBy} = app.id`)
      .where(
        and(
          eq(payrollRuns.id, data.payrollRunId),
          eq(payrollRuns.tenantId, tenantId)
        )
      );

    if (!runHeader) {
      throw new Error("Payroll run not found.");
    }

    const itemsRows = await db
      .select({
        id: payrollItems.id,
        staffUserId: payrollItems.staffUserId,
        staffName: staffUsers.name,
        staffEmail: staffUsers.email,
        staffPhone: staffUsers.phone,
        staffRole: staffUsers.role,
        branchName: branches.name,
        basicSalary: payrollItems.basicSalary,
        totalAllowances: payrollItems.totalAllowances,
        grossSalary: payrollItems.grossSalary,
        unpaidDays: payrollItems.unpaidDays,
        unpaidDeduction: payrollItems.unpaidDeduction,
        standardDeductions: payrollItems.standardDeductions,
        netSalary: payrollItems.netSalary,
        notes: payrollItems.notes,
        bankName: employeeSalaryProfiles.bankName,
        iban: employeeSalaryProfiles.iban,
      })
      .from(payrollItems)
      .innerJoin(staffUsers, eq(payrollItems.staffUserId, staffUsers.id))
      .leftJoin(branches, eq(staffUsers.branchId, branches.id))
      .leftJoin(
        employeeSalaryProfiles,
        eq(staffUsers.id, employeeSalaryProfiles.staffUserId)
      )
      .where(eq(payrollItems.payrollRunId, runHeader.id))
      .orderBy(staffUsers.name);

    return {
      success: true,
      run: {
        id: runHeader.id,
        branchId: runHeader.branchId,
        branchName: runHeader.branchName || "All Branches",
        month: runHeader.month,
        status: runHeader.status,
        totalGross: Number(runHeader.totalGross ?? 0),
        totalDeductions: Number(runHeader.totalDeductions ?? 0),
        totalNet: Number(runHeader.totalNet ?? 0),
        generatedByName: runHeader.generatedByName || "System",
        generatedAt: runHeader.generatedAt ? runHeader.generatedAt.toISOString() : null,
        approvedByName: runHeader.approvedByName || null,
        approvedAt: runHeader.approvedAt ? runHeader.approvedAt.toISOString() : null,
        paidAt: runHeader.paidAt ? runHeader.paidAt.toISOString() : null,
      },
      items: itemsRows.map((item) => ({
        id: item.id,
        staffUserId: item.staffUserId,
        staffName: item.staffName || "Staff Member",
        staffEmail: item.staffEmail,
        staffPhone: item.staffPhone || "",
        staffRole: item.staffRole,
        branchName: item.branchName || "Unassigned",
        basicSalary: Number(item.basicSalary ?? 0),
        totalAllowances: Number(item.totalAllowances ?? 0),
        grossSalary: Number(item.grossSalary ?? 0),
        unpaidDays: item.unpaidDays,
        unpaidDeduction: Number(item.unpaidDeduction ?? 0),
        standardDeductions: Number(item.standardDeductions ?? 0),
        netSalary: Number(item.netSalary ?? 0),
        notes: item.notes,
        bankName: item.bankName || "Not set",
        iban: item.iban || "",
      })),
    };
  });

// 5. Approve Payroll Run (Draft -> Approved)
export const approvePayrollRunFn = createServerFn({ method: "POST" })
  .validator((d: { payrollRunId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId, userId } = await resolvePayrollTenantContext();

    const existingRun = await db.query.payrollRuns.findFirst({
      where: and(
        eq(payrollRuns.id, data.payrollRunId),
        eq(payrollRuns.tenantId, tenantId)
      ),
    });

    if (!existingRun) {
      throw new Error("Payroll run not found.");
    }

    if (existingRun.status !== "Draft") {
      throw new Error(`Cannot approve a payroll run that is already ${existingRun.status}.`);
    }

    const [updated] = await db
      .update(payrollRuns)
      .set({
        status: "Approved",
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payrollRuns.id, existingRun.id))
      .returning();

    try {
      await logAuditAction({
        action: "Approve Payroll Run",
        entityType: "payroll_runs",
        entityId: existingRun.id,
        summary: `Approved and locked payroll run for ${existingRun.month} (Net AED ${existingRun.totalNet})`,
      });
    } catch {}

    return {
      success: true,
      payrollRun: updated,
    };
  });

// 6. Mark Payroll Run Paid (Approved -> Paid)
export const markPayrollRunPaidFn = createServerFn({ method: "POST" })
  .validator((d: { payrollRunId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId } = await resolvePayrollTenantContext();

    const existingRun = await db.query.payrollRuns.findFirst({
      where: and(
        eq(payrollRuns.id, data.payrollRunId),
        eq(payrollRuns.tenantId, tenantId)
      ),
    });

    if (!existingRun) {
      throw new Error("Payroll run not found.");
    }

    if (existingRun.status !== "Approved") {
      throw new Error(
        `Only 'Approved' payroll runs can be marked as Paid. Current status is '${existingRun.status}'.`
      );
    }

    const [updated] = await db
      .update(payrollRuns)
      .set({
        status: "Paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payrollRuns.id, existingRun.id))
      .returning();

    try {
      await logAuditAction({
        action: "Mark Payroll Run Paid",
        entityType: "payroll_runs",
        entityId: existingRun.id,
        summary: `Marked payroll run for ${existingRun.month} as Paid (Net AED ${existingRun.totalNet})`,
      });
    } catch {}

    return {
      success: true,
      payrollRun: updated,
    };
  });

// 7. Delete Draft Payroll Run
export const deletePayrollRunFn = createServerFn({ method: "POST" })
  .validator((d: { payrollRunId: string }) => d)
  .handler(async ({ data }) => {
    const { tenantId } = await resolvePayrollTenantContext();

    const existingRun = await db.query.payrollRuns.findFirst({
      where: and(
        eq(payrollRuns.id, data.payrollRunId),
        eq(payrollRuns.tenantId, tenantId)
      ),
    });

    if (!existingRun) {
      throw new Error("Payroll run not found.");
    }

    if (existingRun.status !== "Draft") {
      throw new Error(
        `Cannot delete a payroll run with status '${existingRun.status}'. Only Draft runs can be deleted.`
      );
    }

    await db.delete(payrollRuns).where(eq(payrollRuns.id, existingRun.id));

    try {
      await logAuditAction({
        action: "Delete Draft Payroll Run",
        entityType: "payroll_runs",
        entityId: existingRun.id,
        summary: `Deleted Draft payroll run for ${existingRun.month}`,
      });
    } catch {}

    return {
      success: true,
      message: "Draft payroll run deleted successfully.",
    };
  });

// ====================================================
// PAYSLIP DATA FETCHING (PHASE 5)
// ====================================================

// 8. Fetch complete payslip payload for PDF rendering
export const getPayslipDataFn = createServerFn({ method: "POST" })
  .validator((d: { payrollRunId: string; staffUserId?: string }) => d)
  .handler(async ({ data }) => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || !res.session.id) {
      throw new Error("Unauthorized: Session required.");
    }

    const role = res.session.role;
    const isHeadOffice = role === "Head Office Admin" || role === "Super Admin";
    const tenantId = res.session.tenantId!;

    // Security: If not Head Office/Super Admin, force staffUserId to session user's ID (IDOR-safe)
    const targetStaffUserId = isHeadOffice && data.staffUserId ? data.staffUserId : res.session.id;

    const [runHeader] = await db
      .select({
        id: payrollRuns.id,
        tenantId: payrollRuns.tenantId,
        branchId: payrollRuns.branchId,
        branchName: branches.name,
        month: payrollRuns.month,
        status: payrollRuns.status,
        totalGross: payrollRuns.totalGross,
        totalDeductions: payrollRuns.totalDeductions,
        totalNet: payrollRuns.totalNet,
        generatedAt: payrollRuns.generatedAt,
        approvedAt: payrollRuns.approvedAt,
        paidAt: payrollRuns.paidAt,
        approvedByName: sql<string | null>`app.name`,
      })
      .from(payrollRuns)
      .leftJoin(branches, eq(payrollRuns.branchId, branches.id))
      .leftJoin(sql`staff_users AS app`, sql`${payrollRuns.approvedBy} = app.id`)
      .where(
        and(
          eq(payrollRuns.id, data.payrollRunId),
          eq(payrollRuns.tenantId, tenantId)
        )
      );

    if (!runHeader) {
      throw new Error("Payroll run not found.");
    }

    // If regular employee, block draft runs from being viewed/downloaded
    if (!isHeadOffice && runHeader.status !== "Approved" && runHeader.status !== "Paid") {
      throw new Error(
        "Payslip is not yet available. This payroll run is still in Draft status and awaiting management approval."
      );
    }

    // Query employee record
    const staff = await db.query.staffUsers.findFirst({
      where: and(
        eq(staffUsers.id, targetStaffUserId),
        eq(staffUsers.tenantId, tenantId)
      ),
      with: {
        branch: true,
      },
    });

    if (!staff) {
      throw new Error("Employee record not found.");
    }

    // Query the specific frozen item in this payroll run
    const item = await db.query.payrollItems.findFirst({
      where: and(
        eq(payrollItems.payrollRunId, runHeader.id),
        eq(payrollItems.staffUserId, targetStaffUserId)
      ),
    });

    if (!item) {
      throw new Error("No payroll item found for this employee in the specified payroll run.");
    }

    // Query current salary profile for banking and allowance breakdown
    const profile = await db.query.employeeSalaryProfiles.findFirst({
      where: and(
        eq(employeeSalaryProfiles.staffUserId, targetStaffUserId),
        eq(employeeSalaryProfiles.tenantId, tenantId)
      ),
    });

    const basicSalary = Number(item.basicSalary ?? 0);
    const totalAllowances = Number(item.totalAllowances ?? 0);
    const grossSalary = Number(item.grossSalary ?? 0);
    const housingAllowance = Number(profile?.housingAllowance ?? 0);
    const transportAllowance = Number(profile?.transportAllowance ?? 0);
    const otherAllowances = Number(profile?.otherAllowances ?? 0);

    const unpaidDays = item.unpaidDays ?? 0;
    const unpaidDeduction = Number(item.unpaidDeduction ?? 0);
    const standardDeductions = Number(item.standardDeductions ?? 0);
    const totalDeductions = unpaidDeduction + standardDeductions;
    const netSalary = Number(item.netSalary ?? 0);

    const rawIban = (profile?.iban || "").trim();
    const maskedIban = rawIban
      ? rawIban.length > 4
        ? `••••••••••••${rawIban.slice(-4)}`
        : rawIban
      : null;

    const payslipNumber = `PAY-${runHeader.month.replace("-", "")}-${staff.id.slice(0, 6).toUpperCase()}`;

    return {
      success: true,
      payslip: {
        payslipNumber,
        periodMonth: runHeader.month,
        generatedAt: runHeader.generatedAt ? runHeader.generatedAt.toISOString() : new Date().toISOString(),
        status: runHeader.status,
        approvedByName: runHeader.approvedByName || null,
        approvedAt: runHeader.approvedAt ? runHeader.approvedAt.toISOString() : null,
        paidAt: runHeader.paidAt ? runHeader.paidAt.toISOString() : null,
        currency: profile?.currency || "AED",
        employee: {
          id: staff.id,
          name: staff.name || "Employee",
          role: staff.role,
          branchName: staff.branch?.name || runHeader.branchName || "Unassigned",
          joinDate: profile?.joinDate ? String(profile.joinDate) : null,
          bankName: profile?.bankName || null,
          maskedIban,
          email: staff.email,
          phone: staff.phone,
        },
        earnings: {
          basicSalary,
          housingAllowance,
          transportAllowance,
          otherAllowances,
          totalAllowances,
          grossSalary,
        },
        deductions: {
          unpaidDays,
          unpaidDeduction,
          standardDeductions,
          totalDeductions,
          notes: item.notes,
        },
        netSalary,
      },
    };
  });

// 9. Employee Self-Service: Get list of finalized payslips
export const getMyPayslipsListFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session || !res.session.id) {
      throw new Error("Unauthorized: Please sign in.");
    }
    const userId = res.session.id;
    const tenantId = res.session.tenantId!;

    const rows = await db
      .select({
        itemId: payrollItems.id,
        payrollRunId: payrollRuns.id,
        month: payrollRuns.month,
        status: payrollRuns.status,
        branchName: branches.name,
        grossSalary: payrollItems.grossSalary,
        netSalary: payrollItems.netSalary,
        unpaidDays: payrollItems.unpaidDays,
        unpaidDeduction: payrollItems.unpaidDeduction,
        standardDeductions: payrollItems.standardDeductions,
        approvedAt: payrollRuns.approvedAt,
        paidAt: payrollRuns.paidAt,
        generatedAt: payrollRuns.generatedAt,
      })
      .from(payrollItems)
      .innerJoin(payrollRuns, eq(payrollItems.payrollRunId, payrollRuns.id))
      .leftJoin(branches, eq(payrollRuns.branchId, branches.id))
      .where(
        and(
          eq(payrollRuns.tenantId, tenantId),
          eq(payrollItems.staffUserId, userId),
          inArray(payrollRuns.status, ["Approved", "Paid"])
        )
      )
      .orderBy(desc(payrollRuns.month), desc(payrollRuns.createdAt));

    return {
      success: true,
      payslips: rows.map((r) => ({
        itemId: r.itemId,
        payrollRunId: r.payrollRunId,
        month: r.month,
        status: r.status,
        branchName: r.branchName || "All Branches",
        grossSalary: Number(r.grossSalary ?? 0),
        netSalary: Number(r.netSalary ?? 0),
        unpaidDays: r.unpaidDays,
        unpaidDeduction: Number(r.unpaidDeduction ?? 0),
        standardDeductions: Number(r.standardDeductions ?? 0),
        approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
        paidAt: r.paidAt ? r.paidAt.toISOString() : null,
        generatedAt: r.generatedAt ? r.generatedAt.toISOString() : null,
      })),
    };
  });



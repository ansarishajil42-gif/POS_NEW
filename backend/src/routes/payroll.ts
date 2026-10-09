import { Router } from "express";
import { db } from "../db/index.js";
import {
  staffUsers,
  employeeSalaryProfiles,
  attendanceRecords,
  leaveRequests,
  payrollRuns,
  payrollItems,
  branches,
  tenants,
} from "../db/schema.js";
import { eq, and, asc, desc, gte, lte, sql, inArray } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// Middleware: All payroll endpoints require authenticated session
router.use(requireAuth);

/**
 * Helper to resolve and validate the session tenant ID.
 * Strictly derives tenantId from the JWT session to prevent cross-tenant data leakage.
 */
function resolveTenantId(req: AuthRequest): string | null {
  const user = req.user;
  if (!user) return null;

  // Super Admin can optionally target a specific tenant
  if (user.role === "super_admin") {
    if (req.query.tenantId && typeof req.query.tenantId === "string" && req.query.tenantId !== "all") {
      return req.query.tenantId;
    }
    if (req.body?.tenantId && typeof req.body.tenantId === "string") {
      return req.body.tenantId;
    }
  }

  // Head Office Admin (and any tenant staff) ALWAYS uses their session tenantId
  return user.tenantId || null;
}

/**
 * 1. GET /api/payroll/salary-profiles
 * Head Office Admin only. Returns all staff for the tenant from staffUsers
 * LEFT JOINed with branches and employeeSalaryProfiles.
 * Strictly scoped to session tenantId.
 */
router.get("/salary-profiles", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { branchId, search } = req.query;

    const conditions = [eq(staffUsers.tenantId, tenantId)];
    if (branchId && typeof branchId === "string" && branchId !== "all") {
      conditions.push(eq(staffUsers.branchId, branchId));
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
      .orderBy(asc(staffUsers.name));

    let staffProfiles = rows.map((r) => {
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

    if (search && typeof search === "string" && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      staffProfiles = staffProfiles.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.email && p.email.toLowerCase().includes(q)) ||
          (p.role && p.role.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      staffProfiles,
    });
  } catch (error: any) {
    console.error("Get staff salary profiles error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch salary profiles" });
  }
});

/**
 * 2. POST /api/payroll/salary-profiles
 * Upsert salary profile for a staff user.
 * Strictly verifies staff member belongs to the session tenantId.
 */
router.post("/salary-profiles", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const {
      staffUserId,
      basicSalary,
      housingAllowance,
      transportAllowance,
      otherAllowances,
      standardDeductions,
      paymentFrequency,
      currency,
      bankName,
      iban,
      joinDate,
    } = req.body;

    if (!staffUserId) {
      return res.status(400).json({ success: false, error: "staffUserId is required" });
    }

    // Verify staff user belongs to the session tenantId
    const staff = await db.query.staffUsers.findFirst({
      where: and(
        eq(staffUsers.id, staffUserId),
        eq(staffUsers.tenantId, tenantId)
      ),
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: "Staff member not found or does not belong to your organization.",
      });
    }

    const basicSalaryStr = Number(basicSalary || 0).toFixed(2);
    const housingAllowanceStr = Number(housingAllowance || 0).toFixed(2);
    const transportAllowanceStr = Number(transportAllowance || 0).toFixed(2);
    const otherAllowancesStr = Number(otherAllowances || 0).toFixed(2);
    const standardDeductionsStr = Number(standardDeductions || 0).toFixed(2);
    const freq = paymentFrequency || "monthly";
    const curr = currency || "AED";
    const bName = bankName ? String(bankName).trim() : null;
    const ibanStr = iban ? String(iban).trim() : null;
    const jDate = joinDate ? String(joinDate).trim().slice(0, 10) : null;

    // Check if profile already exists for this tenant & staff
    const existing = await db.query.employeeSalaryProfiles.findFirst({
      where: and(
        eq(employeeSalaryProfiles.tenantId, tenantId),
        eq(employeeSalaryProfiles.staffUserId, staffUserId)
      ),
    });

    let savedProfile;

    if (existing) {
      const [updated] = await db
        .update(employeeSalaryProfiles)
        .set({
          basicSalary: basicSalaryStr,
          housingAllowance: housingAllowanceStr,
          transportAllowance: transportAllowanceStr,
          otherAllowances: otherAllowancesStr,
          standardDeductions: standardDeductionsStr,
          paymentFrequency: freq,
          currency: curr,
          bankName: bName,
          iban: ibanStr,
          joinDate: jDate,
          updatedAt: new Date(),
        })
        .where(eq(employeeSalaryProfiles.id, existing.id))
        .returning();
      savedProfile = updated;
    } else {
      const [inserted] = await db
        .insert(employeeSalaryProfiles)
        .values({
          tenantId,
          staffUserId,
          basicSalary: basicSalaryStr,
          housingAllowance: housingAllowanceStr,
          transportAllowance: transportAllowanceStr,
          otherAllowances: otherAllowancesStr,
          standardDeductions: standardDeductionsStr,
          paymentFrequency: freq,
          currency: curr,
          bankName: bName,
          iban: ibanStr,
          joinDate: jDate,
        })
        .returning();
      savedProfile = inserted;
    }

    res.json({
      success: true,
      profile: savedProfile,
      message: "Salary profile saved successfully",
    });
  } catch (error: any) {
    console.error("Upsert salary profile error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to save salary profile" });
  }
});

// ============================================================================
// PART A — Attendance Tracking
// ============================================================================

/**
 * 3. GET /api/payroll/attendance
 * Returns all active tenant staff with their attendance for target date.
 */
router.get("/attendance", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const targetDate = typeof req.query.date === "string" && req.query.date.trim().length === 10
      ? req.query.date.trim()
      : new Date().toISOString().slice(0, 10);
    const branchId = req.query.branchId;

    const conditions = [eq(staffUsers.tenantId, tenantId), eq(staffUsers.isActive, true)];
    if (branchId && typeof branchId === "string" && branchId !== "all") {
      conditions.push(eq(staffUsers.branchId, branchId));
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
      .orderBy(asc(staffUsers.name));

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

    res.json({
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
    });
  } catch (error: any) {
    console.error("Get attendance error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch attendance records" });
  }
});

/**
 * 4. POST /api/payroll/attendance
 * Mark or update attendance for a single staff member.
 */
router.post("/attendance", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { staffUserId, date, status, hoursWorked, notes } = req.body;

    if (!staffUserId || !date || !status) {
      return res.status(400).json({ success: false, error: "staffUserId, date, and status are required" });
    }

    // Verify staff member belongs to tenant
    const staff = await db.query.staffUsers.findFirst({
      where: and(eq(staffUsers.id, staffUserId), eq(staffUsers.tenantId, tenantId)),
    });
    if (!staff) {
      return res.status(404).json({ success: false, error: "Staff member not found in your organization" });
    }

    const targetDate = String(date).trim().slice(0, 10);
    const targetStatus = String(status).trim();
    const defaultHours = targetStatus === "half_day" ? 4 : targetStatus === "present" ? 8 : 0;
    const hours = hoursWorked !== undefined && hoursWorked !== null ? Number(hoursWorked) : defaultHours;
    const hoursStr = (isNaN(hours) || hours < 0 ? 0 : hours).toFixed(2);
    const notesStr = notes ? String(notes).trim() : null;

    const existing = await db.query.attendanceRecords.findFirst({
      where: and(
        eq(attendanceRecords.tenantId, tenantId),
        eq(attendanceRecords.staffUserId, staffUserId),
        eq(attendanceRecords.date, targetDate)
      ),
    });

    let record;
    if (existing) {
      const [updated] = await db
        .update(attendanceRecords)
        .set({
          status: targetStatus,
          hoursWorked: hoursStr,
          notes: notesStr,
          markedBy: req.user?.id || null,
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
          staffUserId,
          date: targetDate,
          status: targetStatus,
          hoursWorked: hoursStr,
          notes: notesStr,
          markedBy: req.user?.id || null,
        })
        .returning();
      record = inserted;
    }

    res.json({
      success: true,
      attendance: record,
      message: "Attendance recorded successfully",
    });
  } catch (error: any) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to record attendance" });
  }
});

/**
 * 5. POST /api/payroll/attendance/bulk-present
 * Mark all active staff (optionally branch-filtered) as 'present' for date.
 */
router.post("/attendance/bulk-present", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { date, branchId } = req.body;
    const targetDate = typeof date === "string" && date.trim().length === 10
      ? date.trim()
      : new Date().toISOString().slice(0, 10);

    const conditions = [eq(staffUsers.tenantId, tenantId), eq(staffUsers.isActive, true)];
    if (branchId && typeof branchId === "string" && branchId !== "all") {
      conditions.push(eq(staffUsers.branchId, branchId));
    }

    const activeStaff = await db.select().from(staffUsers).where(and(...conditions));

    let updatedCount = 0;
    for (const staff of activeStaff) {
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
            status: "present",
            hoursWorked: "8.00",
            markedBy: req.user?.id || null,
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
          markedBy: req.user?.id || null,
        });
      }
      updatedCount++;
    }

    res.json({
      success: true,
      message: `Marked ${updatedCount} staff members as present for ${targetDate}`,
      count: updatedCount,
    });
  } catch (error: any) {
    console.error("Bulk mark present error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to perform bulk attendance" });
  }
});

// ============================================================================
// PART B — Leave Management
// ============================================================================

/**
 * 6. POST /api/payroll/leaves
 * Employee submits their OWN leave request. IDOR-safe: staffUserId derived from session ONLY.
 */
router.post("/leaves", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(403).json({ success: false, error: "Forbidden: No authenticated user session" });
    }

    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ success: false, error: "leaveType, startDate, and endDate are required" });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid date format provided" });
    }
    if (sDate > eDate) {
      return res.status(400).json({ success: false, error: "Start date cannot be after end date" });
    }

    const diffDays = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysCount = Math.max(1, diffDays);
    const isPaid = leaveType !== "unpaid";

    const [inserted] = await db
      .insert(leaveRequests)
      .values({
        tenantId,
        staffUserId: userId, // Strictly IDOR-safe
        leaveType: String(leaveType).trim(),
        isPaid,
        startDate: String(startDate).trim().slice(0, 10),
        endDate: String(endDate).trim().slice(0, 10),
        daysCount,
        reason: reason ? String(reason).trim() : null,
        status: "pending",
      })
      .returning();

    res.status(201).json({
      success: true,
      leave: inserted,
      message: "Leave request submitted successfully",
    });
  } catch (error: any) {
    console.error("Submit leave request error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to submit leave request" });
  }
});

/**
 * 7. GET /api/payroll/leaves/mine
 * Logged-in employee's own leave history (session-only).
 */
router.get("/leaves/mine", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(403).json({ success: false, error: "Forbidden: No authenticated user session" });
    }

    const rows = await db
      .select()
      .from(leaveRequests)
      .where(and(eq(leaveRequests.tenantId, tenantId), eq(leaveRequests.staffUserId, userId)))
      .orderBy(desc(leaveRequests.createdAt));

    res.json({
      success: true,
      leaves: rows,
    });
  } catch (error: any) {
    console.error("Get my leaves error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch your leave requests" });
  }
});

/**
 * 8. GET /api/payroll/leaves/pending
 * Head Office Admin view: all leave requests for tenant (optionally filtered by status & branch).
 */
router.get("/leaves/pending", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { status, branchId } = req.query;

    const conditions = [eq(leaveRequests.tenantId, tenantId)];
    if (status && typeof status === "string" && status !== "all") {
      conditions.push(eq(leaveRequests.status, status));
    }
    if (branchId && typeof branchId === "string" && branchId !== "all") {
      conditions.push(eq(staffUsers.branchId, branchId));
    }

    const rows = await db
      .select({
        id: leaveRequests.id,
        staffUserId: leaveRequests.staffUserId,
        staffName: staffUsers.name,
        staffRole: staffUsers.role,
        staffEmail: staffUsers.email,
        branchId: staffUsers.branchId,
        branchName: branches.name,
        leaveType: leaveRequests.leaveType,
        isPaid: leaveRequests.isPaid,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        daysCount: leaveRequests.daysCount,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        approvedBy: leaveRequests.approvedBy,
        approvedAt: leaveRequests.approvedAt,
        createdAt: leaveRequests.createdAt,
        updatedAt: leaveRequests.updatedAt,
      })
      .from(leaveRequests)
      .innerJoin(staffUsers, eq(leaveRequests.staffUserId, staffUsers.id))
      .leftJoin(branches, eq(staffUsers.branchId, branches.id))
      .where(and(...conditions))
      .orderBy(desc(leaveRequests.createdAt));

    res.json({
      success: true,
      leaves: rows,
    });
  } catch (error: any) {
    console.error("Get tenant leaves error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch leave requests" });
  }
});

/**
 * 9. POST /api/payroll/leaves/:id/review
 * Approve or reject a leave request.
 * On approval: upserts attendanceRecords with status='on_leave' for every date in range.
 */
router.post("/leaves/:id/review", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    const reviewerId = req.user?.id;
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const leaveId = req.params.id;
    const { status } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, error: "status must be either 'approved' or 'rejected'" });
    }

    const leave = await db.query.leaveRequests.findFirst({
      where: and(eq(leaveRequests.id, leaveId), eq(leaveRequests.tenantId, tenantId)),
    });

    if (!leave) {
      return res.status(404).json({ success: false, error: "Leave request not found" });
    }

    const [updatedLeave] = await db
      .update(leaveRequests)
      .set({
        status,
        approvedBy: reviewerId || null,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, leaveId))
      .returning();

    // If approved, upsert attendance records with status='on_leave' across the span
    if (status === "approved") {
      const sDate = new Date(leave.startDate);
      const eDate = new Date(leave.endDate);

      const staff = await db.query.staffUsers.findFirst({
        where: eq(staffUsers.id, leave.staffUserId),
      });

      const curr = new Date(sDate);
      while (curr <= eDate) {
        const dStr = curr.toISOString().slice(0, 10);

        const existingAtt = await db.query.attendanceRecords.findFirst({
          where: and(
            eq(attendanceRecords.tenantId, tenantId),
            eq(attendanceRecords.staffUserId, leave.staffUserId),
            eq(attendanceRecords.date, dStr)
          ),
        });

        if (existingAtt) {
          await db
            .update(attendanceRecords)
            .set({
              status: "on_leave",
              hoursWorked: "0.00",
              notes: `Approved leave: ${leave.leaveType}`,
              markedBy: reviewerId || null,
              updatedAt: new Date(),
            })
            .where(eq(attendanceRecords.id, existingAtt.id));
        } else {
          await db.insert(attendanceRecords).values({
            tenantId,
            branchId: staff?.branchId || null,
            staffUserId: leave.staffUserId,
            date: dStr,
            status: "on_leave",
            hoursWorked: "0.00",
            notes: `Approved leave: ${leave.leaveType}`,
            markedBy: reviewerId || null,
          });
        }

        curr.setDate(curr.getDate() + 1);
      }
    }

    res.json({
      success: true,
      leave: updatedLeave,
      message: `Leave request ${status} successfully`,
    });
  } catch (error: any) {
    console.error("Review leave error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to review leave request" });
  }
});

/**
 * 10. PATCH /api/payroll/leaves/:id
 * Employee edits their OWN pending leave request.
 */
router.patch("/leaves/:id", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(403).json({ success: false, error: "Forbidden: No authenticated user session" });
    }

    const leaveId = req.params.id;
    const leave = await db.query.leaveRequests.findFirst({
      where: and(
        eq(leaveRequests.id, leaveId),
        eq(leaveRequests.tenantId, tenantId),
        eq(leaveRequests.staffUserId, userId)
      ),
    });

    if (!leave) {
      return res.status(404).json({ success: false, error: "Leave request not found or not owned by you" });
    }
    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, error: "Only pending leave requests can be modified" });
    }

    const { leaveType, startDate, endDate, reason } = req.body;
    const newStart = startDate ? String(startDate).trim().slice(0, 10) : leave.startDate;
    const newEnd = endDate ? String(endDate).trim().slice(0, 10) : leave.endDate;
    const newType = leaveType ? String(leaveType).trim() : leave.leaveType;

    const sDate = new Date(newStart);
    const eDate = new Date(newEnd);
    if (sDate > eDate) {
      return res.status(400).json({ success: false, error: "Start date cannot be after end date" });
    }

    const diffDays = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysCount = Math.max(1, diffDays);
    const isPaid = newType !== "unpaid";

    const [updated] = await db
      .update(leaveRequests)
      .set({
        leaveType: newType,
        isPaid,
        startDate: newStart,
        endDate: newEnd,
        daysCount,
        reason: reason !== undefined ? (reason ? String(reason).trim() : null) : leave.reason,
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, leaveId))
      .returning();

    res.json({
      success: true,
      leave: updated,
      message: "Leave request updated successfully",
    });
  } catch (error: any) {
    console.error("Update leave error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update leave request" });
  }
});

/**
 * 11. DELETE /api/payroll/leaves/:id
 * Employee deletes their OWN pending leave request.
 */
router.delete("/leaves/:id", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(403).json({ success: false, error: "Forbidden: No authenticated user session" });
    }

    const leaveId = req.params.id;
    const leave = await db.query.leaveRequests.findFirst({
      where: and(
        eq(leaveRequests.id, leaveId),
        eq(leaveRequests.tenantId, tenantId),
        eq(leaveRequests.staffUserId, userId)
      ),
    });

    if (!leave) {
      return res.status(404).json({ success: false, error: "Leave request not found or not owned by you" });
    }
    if (leave.status !== "pending") {
      return res.status(400).json({ success: false, error: "Only pending leave requests can be deleted" });
    }

    await db.delete(leaveRequests).where(eq(leaveRequests.id, leaveId));

    res.json({
      success: true,
      message: "Leave request deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete leave error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to delete leave request" });
  }
});

// ============================================================================
// PART C — Payroll Runs (Calculation Engine)
// ============================================================================

/**
 * Helper to compute payroll items for a given tenant, branch, and month.
 */
async function computePayrollRunItems(tenantId: string, month: string, branchId?: string | null) {
  const staffConditions = [
    eq(staffUsers.tenantId, tenantId),
    eq(staffUsers.isActive, true),
  ];
  if (branchId && branchId !== "all") {
    staffConditions.push(eq(staffUsers.branchId, branchId));
  }

  // Active staff with salary profiles
  const staffRows = await db
    .select({
      staffId: staffUsers.id,
      name: staffUsers.name,
      role: staffUsers.role,
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
    .where(and(...staffConditions));

  const monthStart = `${month}-01`;
  const [yStr, mStr] = month.split("-");
  const lastDay = new Date(parseInt(yStr), parseInt(mStr), 0).getDate();
  const monthEnd = `${month}-${String(lastDay).padStart(2, "0")}`;

  const calculatedItems = [];
  let runTotalGross = 0;
  let runTotalDeductions = 0;
  let runTotalNet = 0;

  for (const staff of staffRows) {
    const basicSalary = parseFloat(staff.basicSalary || "0");
    const housing = parseFloat(staff.housingAllowance || "0");
    const transport = parseFloat(staff.transportAllowance || "0");
    const other = parseFloat(staff.otherAllowances || "0");
    const standardDeductions = parseFloat(staff.standardDeductions || "0");

    const totalAllowances = housing + transport + other;
    const grossSalary = basicSalary + totalAllowances;

    // Count unpaid days in month:
    // 1. Attendance records marked 'absent'
    const absentRecords = await db
      .select()
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.tenantId, tenantId),
          eq(attendanceRecords.staffUserId, staff.staffId),
          eq(attendanceRecords.status, "absent"),
          gte(attendanceRecords.date, monthStart),
          lte(attendanceRecords.date, monthEnd)
        )
      );

    // 2. Approved unpaid leaves
    const unpaidLeaves = await db
      .select()
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.tenantId, tenantId),
          eq(leaveRequests.staffUserId, staff.staffId),
          eq(leaveRequests.leaveType, "unpaid"),
          eq(leaveRequests.status, "approved"),
          lte(leaveRequests.startDate, monthEnd),
          gte(leaveRequests.endDate, monthStart)
        )
      );

    let unpaidDays = absentRecords.length;
    for (const l of unpaidLeaves) {
      // Add days within month range
      const s = new Date(l.startDate > monthStart ? l.startDate : monthStart);
      const e = new Date(l.endDate < monthEnd ? l.endDate : monthEnd);
      const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (days > 0) unpaidDays += days;
    }

    const unpaidDeduction = Math.round(((grossSalary / 30) * unpaidDays) * 100) / 100;
    const netSalary = Math.max(0, Math.round((grossSalary - unpaidDeduction - standardDeductions) * 100) / 100);

    runTotalGross += grossSalary;
    runTotalDeductions += (unpaidDeduction + standardDeductions);
    runTotalNet += netSalary;

    calculatedItems.push({
      staffUserId: staff.staffId,
      basicSalary: basicSalary.toFixed(2),
      totalAllowances: totalAllowances.toFixed(2),
      grossSalary: grossSalary.toFixed(2),
      unpaidDays,
      unpaidDeduction: unpaidDeduction.toFixed(2),
      standardDeductions: standardDeductions.toFixed(2),
      netSalary: netSalary.toFixed(2),
      notes: unpaidDays > 0 ? `${unpaidDays} unpaid absence/leave days deducted` : null,
    });
  }

  return {
    calculatedItems,
    totalGross: runTotalGross.toFixed(2),
    totalDeductions: runTotalDeductions.toFixed(2),
    totalNet: runTotalNet.toFixed(2),
  };
}

/**
 * 12. POST /api/payroll/runs/generate
 * Generate monthly payroll run (Draft).
 */
router.post("/runs/generate", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { month, branchId } = req.body;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ success: false, error: "month must be in YYYY-MM format" });
    }

    const bId = branchId && branchId !== "all" ? branchId : null;

    // Check if run already exists
    const existingRun = await db.query.payrollRuns.findFirst({
      where: and(
        eq(payrollRuns.tenantId, tenantId),
        bId ? eq(payrollRuns.branchId, bId) : sql`${payrollRuns.branchId} IS NULL`,
        eq(payrollRuns.month, month)
      ),
    });

    if (existingRun) {
      return res.status(400).json({
        success: false,
        error: `A payroll run for ${month} already exists (${existingRun.status}). Please review or regenerate the draft.`,
        existingRunId: existingRun.id,
      });
    }

    const { calculatedItems, totalGross, totalDeductions, totalNet } =
      await computePayrollRunItems(tenantId, month, bId);

    if (calculatedItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No active staff with configured salary profiles found for this selection.",
      });
    }

    // Insert Run
    const [run] = await db
      .insert(payrollRuns)
      .values({
        tenantId,
        branchId: bId,
        month,
        status: "Draft",
        totalGross,
        totalDeductions,
        totalNet,
        generatedBy: req.user?.id || null,
      })
      .returning();

    // Insert Items
    const itemRecords = calculatedItems.map((item) => ({
      ...item,
      payrollRunId: run.id,
    }));
    await db.insert(payrollItems).values(itemRecords);

    res.status(201).json({
      success: true,
      run,
      itemsCount: calculatedItems.length,
      message: `Payroll run generated successfully for ${month} with ${calculatedItems.length} staff records`,
    });
  } catch (error: any) {
    console.error("Generate payroll run error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate payroll run" });
  }
});

/**
 * 13. GET /api/payroll/runs
 * List all payroll runs for the tenant.
 */
router.get("/runs", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const { branchId } = req.query;
    const conditions = [eq(payrollRuns.tenantId, tenantId)];
    if (branchId && typeof branchId === "string" && branchId !== "all") {
      conditions.push(eq(payrollRuns.branchId, branchId));
    }

    const rows = await db
      .select({
        id: payrollRuns.id,
        month: payrollRuns.month,
        branchId: payrollRuns.branchId,
        branchName: branches.name,
        status: payrollRuns.status,
        totalGross: payrollRuns.totalGross,
        totalDeductions: payrollRuns.totalDeductions,
        totalNet: payrollRuns.totalNet,
        generatedBy: payrollRuns.generatedBy,
        generatedAt: payrollRuns.generatedAt,
        approvedBy: payrollRuns.approvedBy,
        approvedAt: payrollRuns.approvedAt,
        paidAt: payrollRuns.paidAt,
        createdAt: payrollRuns.createdAt,
      })
      .from(payrollRuns)
      .leftJoin(branches, eq(payrollRuns.branchId, branches.id))
      .where(and(...conditions))
      .orderBy(desc(payrollRuns.month), desc(payrollRuns.createdAt));

    res.json({
      success: true,
      runs: rows,
    });
  } catch (error: any) {
    console.error("Get payroll runs error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch payroll runs" });
  }
});

/**
 * 14. GET /api/payroll/runs/:id
 * Itemized breakdown for a specific payroll run.
 */
router.get("/runs/:id", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const runId = req.params.id;

    const [run] = await db
      .select({
        id: payrollRuns.id,
        month: payrollRuns.month,
        branchId: payrollRuns.branchId,
        branchName: branches.name,
        status: payrollRuns.status,
        totalGross: payrollRuns.totalGross,
        totalDeductions: payrollRuns.totalDeductions,
        totalNet: payrollRuns.totalNet,
        generatedAt: payrollRuns.generatedAt,
        approvedAt: payrollRuns.approvedAt,
        paidAt: payrollRuns.paidAt,
      })
      .from(payrollRuns)
      .leftJoin(branches, eq(payrollRuns.branchId, branches.id))
      .where(and(eq(payrollRuns.id, runId), eq(payrollRuns.tenantId, tenantId)));

    if (!run) {
      return res.status(404).json({ success: false, error: "Payroll run not found" });
    }

    const items = await db
      .select({
        id: payrollItems.id,
        staffUserId: payrollItems.staffUserId,
        staffName: staffUsers.name,
        staffEmail: staffUsers.email,
        staffRole: staffUsers.role,
        basicSalary: payrollItems.basicSalary,
        totalAllowances: payrollItems.totalAllowances,
        grossSalary: payrollItems.grossSalary,
        unpaidDays: payrollItems.unpaidDays,
        unpaidDeduction: payrollItems.unpaidDeduction,
        standardDeductions: payrollItems.standardDeductions,
        netSalary: payrollItems.netSalary,
        notes: payrollItems.notes,
        createdAt: payrollItems.createdAt,
      })
      .from(payrollItems)
      .innerJoin(staffUsers, eq(payrollItems.staffUserId, staffUsers.id))
      .where(eq(payrollItems.payrollRunId, runId))
      .orderBy(asc(staffUsers.name));

    res.json({
      success: true,
      run,
      items,
    });
  } catch (error: any) {
    console.error("Get payroll run detail error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch payroll run detail" });
  }
});

/**
 * 15. POST /api/payroll/runs/:id/regenerate
 * Recalculates and replaces items for a Draft run.
 */
router.post("/runs/:id/regenerate", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const runId = req.params.id;
    const run = await db.query.payrollRuns.findFirst({
      where: and(eq(payrollRuns.id, runId), eq(payrollRuns.tenantId, tenantId)),
    });

    if (!run) {
      return res.status(404).json({ success: false, error: "Payroll run not found" });
    }
    if (run.status !== "Draft") {
      return res.status(400).json({ success: false, error: "Only Draft payroll runs can be regenerated" });
    }

    const { calculatedItems, totalGross, totalDeductions, totalNet } =
      await computePayrollRunItems(tenantId, run.month, run.branchId);

    // Delete old items
    await db.delete(payrollItems).where(eq(payrollItems.payrollRunId, runId));

    // Insert newly calculated items
    const itemRecords = calculatedItems.map((item) => ({
      ...item,
      payrollRunId: runId,
    }));
    await db.insert(payrollItems).values(itemRecords);

    // Update run totals
    const [updatedRun] = await db
      .update(payrollRuns)
      .set({
        totalGross,
        totalDeductions,
        totalNet,
        generatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payrollRuns.id, runId))
      .returning();

    res.json({
      success: true,
      run: updatedRun,
      itemsCount: calculatedItems.length,
      message: "Payroll run recalculated and updated successfully",
    });
  } catch (error: any) {
    console.error("Regenerate payroll run error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to regenerate payroll run" });
  }
});

/**
 * 16. POST /api/payroll/runs/:id/approve
 * Draft -> Approved. Locks calculation.
 */
router.post("/runs/:id/approve", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const runId = req.params.id;
    const run = await db.query.payrollRuns.findFirst({
      where: and(eq(payrollRuns.id, runId), eq(payrollRuns.tenantId, tenantId)),
    });

    if (!run) {
      return res.status(404).json({ success: false, error: "Payroll run not found" });
    }
    if (run.status !== "Draft") {
      return res.status(400).json({ success: false, error: "Only Draft payroll runs can be approved" });
    }

    const [approved] = await db
      .update(payrollRuns)
      .set({
        status: "Approved",
        approvedBy: req.user?.id || null,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payrollRuns.id, runId))
      .returning();

    res.json({
      success: true,
      run: approved,
      message: "Payroll run approved successfully",
    });
  } catch (error: any) {
    console.error("Approve payroll run error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to approve payroll run" });
  }
});

/**
 * 17. POST /api/payroll/runs/:id/mark-paid
 * Approved -> Paid.
 */
router.post("/runs/:id/mark-paid", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const runId = req.params.id;
    const run = await db.query.payrollRuns.findFirst({
      where: and(eq(payrollRuns.id, runId), eq(payrollRuns.tenantId, tenantId)),
    });

    if (!run) {
      return res.status(404).json({ success: false, error: "Payroll run not found" });
    }
    if (run.status !== "Approved") {
      return res.status(400).json({ success: false, error: "Only Approved payroll runs can be marked as Paid" });
    }

    const [paid] = await db
      .update(payrollRuns)
      .set({
        status: "Paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payrollRuns.id, runId))
      .returning();

    res.json({
      success: true,
      run: paid,
      message: "Payroll run marked as Paid successfully",
    });
  } catch (error: any) {
    console.error("Mark payroll run paid error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to mark payroll run as paid" });
  }
});

/**
 * 18. DELETE /api/payroll/runs/:id
 * Only Draft runs can be deleted.
 */
router.delete("/runs/:id", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const runId = req.params.id;
    const run = await db.query.payrollRuns.findFirst({
      where: and(eq(payrollRuns.id, runId), eq(payrollRuns.tenantId, tenantId)),
    });

    if (!run) {
      return res.status(404).json({ success: false, error: "Payroll run not found" });
    }
    if (run.status !== "Draft") {
      return res.status(400).json({ success: false, error: "Only Draft payroll runs can be deleted" });
    }

    await db.delete(payrollRuns).where(eq(payrollRuns.id, runId));

    res.json({
      success: true,
      message: "Payroll run deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete payroll run error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to delete payroll run" });
  }
});

// ============================================================================
// PART D — Payslips (Phases 5 & 6)
// ============================================================================

/**
 * 19. GET /api/payroll/payslips/:runId/:staffUserId
 * Head Office Admin only. Full payslip data for any employee in any run.
 * Strictly scoped to session tenantId.
 */
router.get("/payslips/:runId/:staffUserId", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    const role = req.user?.role;
    const isHeadOffice = role === "head_office_admin" || role === "super_admin";
    if (!isHeadOffice) {
      return res.status(403).json({ success: false, error: "Forbidden: Head Office Admin access required" });
    }

    const { runId, staffUserId } = req.params;

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
      .where(and(eq(payrollRuns.id, runId), eq(payrollRuns.tenantId, tenantId)));

    if (!runHeader) {
      return res.status(404).json({ success: false, error: "Payroll run not found" });
    }

    const staff = await db.query.staffUsers.findFirst({
      where: and(eq(staffUsers.id, staffUserId), eq(staffUsers.tenantId, tenantId)),
      with: { branch: true },
    });

    if (!staff) {
      return res.status(404).json({ success: false, error: "Employee record not found" });
    }

    const item = await db.query.payrollItems.findFirst({
      where: and(eq(payrollItems.payrollRunId, runId), eq(payrollItems.staffUserId, staffUserId)),
    });

    if (!item) {
      return res.status(404).json({ success: false, error: "No payroll item found for this employee in the specified run" });
    }

    const profile = await db.query.employeeSalaryProfiles.findFirst({
      where: and(eq(employeeSalaryProfiles.staffUserId, staffUserId), eq(employeeSalaryProfiles.tenantId, tenantId)),
    });

    const rawIban = (profile?.iban || "").trim();
    const maskedIban = rawIban
      ? rawIban.length > 4
        ? `••••••••••••${rawIban.slice(-4)}`
        : rawIban
      : null;

    const payslipNumber = `PAY-${runHeader.month.replace("-", "")}-${staff.id.slice(0, 6).toUpperCase()}`;

    res.json({
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
          email: staff.email,
          phone: staff.phone,
          branchName: staff.branch?.name || runHeader.branchName || "All Outlets (Consolidated)",
          joinDate: profile?.joinDate ? String(profile.joinDate) : null,
          bankName: profile?.bankName || null,
          maskedIban,
        },
        earnings: {
          basicSalary: Number(item.basicSalary ?? 0),
          housingAllowance: Number(profile?.housingAllowance ?? 0),
          transportAllowance: Number(profile?.transportAllowance ?? 0),
          otherAllowances: Number(profile?.otherAllowances ?? 0),
          totalAllowances: Number(item.totalAllowances ?? 0),
          grossSalary: Number(item.grossSalary ?? 0),
        },
        deductions: {
          unpaidDays: item.unpaidDays ?? 0,
          unpaidDeduction: Number(item.unpaidDeduction ?? 0),
          standardDeductions: Number(item.standardDeductions ?? 0),
          totalDeductions: Number(item.unpaidDeduction ?? 0) + Number(item.standardDeductions ?? 0),
          notes: item.notes,
        },
        netSalary: Number(item.netSalary ?? 0),
      },
    });
  } catch (error: any) {
    console.error("Get admin payslip error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch payslip data" });
  }
});

/**
 * 20. GET /api/payroll/my-payslips
 * Employee self-service: list of the logged-in employee's own past payslips.
 * Strictly IDOR-safe (staffUserId derived solely from session JWT).
 * Only returns runs where status is 'Approved' or 'Paid' (never 'Draft').
 */
router.get("/my-payslips", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(403).json({ success: false, error: "Forbidden: No authenticated user session" });
    }

    const rows = await db
      .select({
        itemId: payrollItems.id,
        payrollRunId: payrollRuns.id,
        month: payrollRuns.month,
        status: payrollRuns.status,
        branchName: branches.name,
        basicSalary: payrollItems.basicSalary,
        totalAllowances: payrollItems.totalAllowances,
        grossSalary: payrollItems.grossSalary,
        unpaidDays: payrollItems.unpaidDays,
        unpaidDeduction: payrollItems.unpaidDeduction,
        standardDeductions: payrollItems.standardDeductions,
        netSalary: payrollItems.netSalary,
        approvedAt: payrollRuns.approvedAt,
        paidAt: payrollRuns.paidAt,
        generatedAt: payrollRuns.generatedAt,
        createdAt: payrollRuns.createdAt,
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

    res.json({
      success: true,
      payslips: rows.map((r) => ({
        itemId: r.itemId,
        payrollRunId: r.payrollRunId,
        month: r.month,
        status: r.status,
        branchName: r.branchName || "All Outlets (Consolidated)",
        basicSalary: Number(r.basicSalary ?? 0),
        totalAllowances: Number(r.totalAllowances ?? 0),
        grossSalary: Number(r.grossSalary ?? 0),
        unpaidDays: r.unpaidDays,
        unpaidDeduction: Number(r.unpaidDeduction ?? 0),
        standardDeductions: Number(r.standardDeductions ?? 0),
        netSalary: Number(r.netSalary ?? 0),
        approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
        paidAt: r.paidAt ? r.paidAt.toISOString() : null,
      })),
    });
  } catch (error: any) {
    console.error("Get my payslips error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch your payslips" });
  }
});

/**
 * 21. GET /api/payroll/my-payslips/:runId
 * Employee self-service: full detail of ONE specific payslip for the logged-in employee.
 * Strictly IDOR-safe (staffUserId derived solely from session JWT).
 * Only returns if run is 'Approved' or 'Paid' (never 'Draft').
 */
router.get("/my-payslips/:runId", async (req: AuthRequest, res) => {
  try {
    const tenantId = resolveTenantId(req);
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      return res.status(403).json({ success: false, error: "Forbidden: No authenticated user session" });
    }

    const { runId } = req.params;

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
      .where(and(eq(payrollRuns.id, runId), eq(payrollRuns.tenantId, tenantId)));

    if (!runHeader) {
      return res.status(404).json({ success: false, error: "Payroll run not found" });
    }

    if (runHeader.status !== "Approved" && runHeader.status !== "Paid") {
      return res.status(403).json({
        success: false,
        error: "Payslip is not yet available. This payroll run is still in Draft status and awaiting management approval.",
      });
    }

    const staff = await db.query.staffUsers.findFirst({
      where: and(eq(staffUsers.id, userId), eq(staffUsers.tenantId, tenantId)),
      with: { branch: true },
    });

    if (!staff) {
      return res.status(404).json({ success: false, error: "Employee record not found" });
    }

    const item = await db.query.payrollItems.findFirst({
      where: and(eq(payrollItems.payrollRunId, runId), eq(payrollItems.staffUserId, userId)),
    });

    if (!item) {
      return res.status(404).json({ success: false, error: "No payroll item found for you in this payroll run" });
    }

    const profile = await db.query.employeeSalaryProfiles.findFirst({
      where: and(eq(employeeSalaryProfiles.staffUserId, userId), eq(employeeSalaryProfiles.tenantId, tenantId)),
    });

    const rawIban = (profile?.iban || "").trim();
    const maskedIban = rawIban
      ? rawIban.length > 4
        ? `••••••••••••${rawIban.slice(-4)}`
        : rawIban
      : null;

    const payslipNumber = `PAY-${runHeader.month.replace("-", "")}-${staff.id.slice(0, 6).toUpperCase()}`;

    res.json({
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
          email: staff.email,
          phone: staff.phone,
          branchName: staff.branch?.name || runHeader.branchName || "All Outlets (Consolidated)",
          joinDate: profile?.joinDate ? String(profile.joinDate) : null,
          bankName: profile?.bankName || null,
          maskedIban,
        },
        earnings: {
          basicSalary: Number(item.basicSalary ?? 0),
          housingAllowance: Number(profile?.housingAllowance ?? 0),
          transportAllowance: Number(profile?.transportAllowance ?? 0),
          otherAllowances: Number(profile?.otherAllowances ?? 0),
          totalAllowances: Number(item.totalAllowances ?? 0),
          grossSalary: Number(item.grossSalary ?? 0),
        },
        deductions: {
          unpaidDays: item.unpaidDays ?? 0,
          unpaidDeduction: Number(item.unpaidDeduction ?? 0),
          standardDeductions: Number(item.standardDeductions ?? 0),
          totalDeductions: Number(item.unpaidDeduction ?? 0) + Number(item.standardDeductions ?? 0),
          notes: item.notes,
        },
        netSalary: Number(item.netSalary ?? 0),
      },
    });
  } catch (error: any) {
    console.error("Get my payslip detail error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch your payslip detail" });
  }
});

export default router;

import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import { expenses, branches, staffUsers } from "@/server/db/schema";
import { eq, and, isNull, sql, desc, gte, lte } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";
import { createClient } from "@supabase/supabase-js";

export const EXPENSE_CATEGORIES = [
  "Maintenance",
  "Utilities (Electricity/Water)",
  "Rent",
  "Cleaning",
  "Repair",
  "Salaries-Other",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

const PRIVATE_RECEIPTS_BUCKET = "expense-receipts";

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase configuration missing: SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are required."
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Receipt upload helper: max 5MB, images/pdf, uploads to private bucket 'expense-receipts'
export const uploadExpenseReceiptFn = createServerFn({ method: "POST" })
  .validator((d: { base64Data: string; fileName: string; mimeType: string }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (!sessionRes.success || !sessionRes.session) {
      throw new Error("Unauthorized: Session is required to upload receipts.");
    }

    const role = sessionRes.session.role;
    const isAllowedRole =
      role === "Branch Manager" ||
      role === "branch_manager" ||
      role === "Head Office Admin" ||
      role === "head_office_admin" ||
      role === "Super Admin" ||
      role === "super_admin";

    if (!isAllowedRole) {
      throw new Error("Unauthorized: You do not have permission to upload receipts.");
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (!allowedMimeTypes.includes(data.mimeType)) {
      throw new Error("Invalid file type. Only images (JPG, PNG, WEBP, GIF) and PDF files are allowed.");
    }

    const buffer = Buffer.from(data.base64Data, "base64");
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error("File size exceeds maximum limit of 5MB.");
    }

    try {
      const supabaseClient = getSupabaseClient();
      const folder = sessionRes.session.tenantId || "platform";
      const fileExt = data.fileName.split(".").pop() || "bin";
      const newFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `receipts/${folder}/${newFileName}`;

      const { error } = await supabaseClient.storage
        .from(PRIVATE_RECEIPTS_BUCKET)
        .upload(filePath, buffer, {
          contentType: data.mimeType,
          upsert: true,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, storagePath: filePath };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to upload receipt" };
    }
  });

// Signed URL helper: returns 10-minute signed URL for an expense receipt
export const getExpenseReceiptUrlFn = createServerFn({ method: "POST" })
  .validator((d: { expenseId: string }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (!sessionRes.success || !sessionRes.session) {
      throw new Error("Unauthorized: Session required.");
    }

    const { role, tenantId, branchId } = sessionRes.session;

    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, data.expenseId))
      .limit(1);

    if (!expense) {
      throw new Error("Expense record not found.");
    }

    if (!expense.receiptUrl) {
      throw new Error("No receipt attached to this expense.");
    }

    // Role-based access validation
    if (role === "Branch Manager" || role === "branch_manager") {
      if (!tenantId || !branchId || expense.tenantId !== tenantId || expense.branchId !== branchId) {
        throw new Error("Unauthorized: You cannot access receipts outside your branch.");
      }
    } else if (role === "Head Office Admin" || role === "head_office_admin") {
      if (!tenantId || expense.tenantId !== tenantId) {
        throw new Error("Unauthorized: You cannot access receipts outside your organization.");
      }
    } else if (role === "Super Admin" || role === "super_admin") {
      // Super Admin can view all platform expenses
    } else {
      throw new Error("Unauthorized role.");
    }

    // If legacy receiptUrl was stored as full URL, handle appropriately, otherwise create signed URL from path
    const storagePath = expense.receiptUrl.startsWith("http")
      ? expense.receiptUrl.split(`${PRIVATE_RECEIPTS_BUCKET}/`)[1] || expense.receiptUrl
      : expense.receiptUrl;

    if (expense.receiptUrl.startsWith("http")) {
      return { success: true, signedUrl: expense.receiptUrl };
    }

    const supabaseClient = getSupabaseClient();
    const { data: signedData, error } = await supabaseClient.storage
      .from(PRIVATE_RECEIPTS_BUCKET)
      .createSignedUrl(storagePath, 600); // 600 seconds = 10 minutes

    if (error || !signedData?.signedUrl) {
      throw new Error(error?.message || "Failed to generate secure receipt URL.");
    }

    return { success: true, signedUrl: signedData.signedUrl };
  });

// ==========================================
// 1. BRANCH MANAGER EXPENSES (Strictly own branch)
// ==========================================

export const getBranchExpensesFn = createServerFn({ method: "GET" })
  .validator((d?: { month?: string }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      (sessionRes.session.role !== "Branch Manager" && sessionRes.session.role !== "branch_manager") ||
      !sessionRes.session.tenantId ||
      !sessionRes.session.branchId
    ) {
      throw new Error("Unauthorized: Access restricted to Branch Managers.");
    }

    const { tenantId, branchId } = sessionRes.session;
    const month = data?.month; // Format: "YYYY-MM"

    let conditions = [
      eq(expenses.tenantId, tenantId),
      eq(expenses.branchId, branchId),
    ];

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const startOfMonth = `${month}-01`;
      const [yearStr, monthStr] = month.split("-");
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const lastDay = new Date(y, m, 0).getDate();
      const endOfMonth = `${month}-${String(lastDay).padStart(2, "0")}`;
      conditions.push(gte(expenses.expenseDate, startOfMonth));
      conditions.push(lte(expenses.expenseDate, endOfMonth));
    }

    const rows = await db
      .select({
        id: expenses.id,
        tenantId: expenses.tenantId,
        branchId: expenses.branchId,
        category: expenses.category,
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
        notes: expenses.notes,
        receiptUrl: expenses.receiptUrl,
        createdBy: expenses.createdBy,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));

    const total = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    return {
      success: true,
      expenses: rows,
      total: Number(total.toFixed(2)),
    };
  });

export const createBranchExpenseFn = createServerFn({ method: "POST" })
  .validator((d: {
    category: string;
    amount: number;
    expenseDate: string;
    notes?: string;
    receiptUrl?: string;
  }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      (sessionRes.session.role !== "Branch Manager" && sessionRes.session.role !== "branch_manager") ||
      !sessionRes.session.tenantId ||
      !sessionRes.session.branchId
    ) {
      throw new Error("Unauthorized: Access restricted to Branch Managers.");
    }

    if (!data.category || !EXPENSE_CATEGORIES.includes(data.category as ExpenseCategory)) {
      throw new Error("Invalid expense category.");
    }

    const numAmount = Number(data.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Expense amount must be greater than 0.");
    }

    if (!data.expenseDate || isNaN(new Date(data.expenseDate).getTime())) {
      throw new Error("Valid expense date is required.");
    }

    const { tenantId, branchId, id: userId } = sessionRes.session;

    const [created] = await db
      .insert(expenses)
      .values({
        tenantId,
        branchId,
        category: data.category,
        amount: String(numAmount.toFixed(2)),
        expenseDate: data.expenseDate,
        notes: data.notes?.trim() || null,
        receiptUrl: data.receiptUrl?.trim() || null,
        createdBy: userId || null,
      })
      .returning();

    return { success: true, expense: created };
  });

export const updateBranchExpenseFn = createServerFn({ method: "POST" })
  .validator((d: {
    id: string;
    category: string;
    amount: number;
    expenseDate: string;
    notes?: string;
    receiptUrl?: string;
  }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      (sessionRes.session.role !== "Branch Manager" && sessionRes.session.role !== "branch_manager") ||
      !sessionRes.session.tenantId ||
      !sessionRes.session.branchId
    ) {
      throw new Error("Unauthorized: Access restricted to Branch Managers.");
    }

    if (!data.category || !EXPENSE_CATEGORIES.includes(data.category as ExpenseCategory)) {
      throw new Error("Invalid expense category.");
    }

    const numAmount = Number(data.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Expense amount must be greater than 0.");
    }

    if (!data.expenseDate || isNaN(new Date(data.expenseDate).getTime())) {
      throw new Error("Valid expense date is required.");
    }

    const { tenantId, branchId } = sessionRes.session;

    const [updated] = await db
      .update(expenses)
      .set({
        category: data.category,
        amount: String(numAmount.toFixed(2)),
        expenseDate: data.expenseDate,
        notes: data.notes?.trim() || null,
        receiptUrl: data.receiptUrl !== undefined ? data.receiptUrl.trim() || null : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, data.id),
          eq(expenses.tenantId, tenantId),
          eq(expenses.branchId, branchId)
        )
      )
      .returning();

    if (!updated) {
      throw new Error("Expense record not found or permission denied.");
    }

    return { success: true, expense: updated };
  });

export const deleteBranchExpenseFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      (sessionRes.session.role !== "Branch Manager" && sessionRes.session.role !== "branch_manager") ||
      !sessionRes.session.tenantId ||
      !sessionRes.session.branchId
    ) {
      throw new Error("Unauthorized: Access restricted to Branch Managers.");
    }

    const { tenantId, branchId } = sessionRes.session;

    const [deleted] = await db
      .delete(expenses)
      .where(
        and(
          eq(expenses.id, data.id),
          eq(expenses.tenantId, tenantId),
          eq(expenses.branchId, branchId)
        )
      )
      .returning();

    if (!deleted) {
      throw new Error("Expense record not found or permission denied.");
    }

    return { success: true };
  });

// ==========================================
// 2. HEAD OFFICE ADMIN EXPENSES (All branches of own tenant)
// ==========================================

export const getHeadOfficeExpensesFn = createServerFn({ method: "GET" })
  .validator((d?: {
    branchId?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      (sessionRes.session.role !== "Head Office Admin" && sessionRes.session.role !== "head_office_admin") ||
      !sessionRes.session.tenantId
    ) {
      throw new Error("Unauthorized: Access restricted to Head Office Admin.");
    }

    const { tenantId } = sessionRes.session;

    let conditions = [eq(expenses.tenantId, tenantId)];

    if (data?.branchId && data.branchId !== "all") {
      conditions.push(eq(expenses.branchId, data.branchId));
    }
    if (data?.category && data.category !== "all") {
      conditions.push(eq(expenses.category, data.category));
    }
    if (data?.startDate) {
      conditions.push(gte(expenses.expenseDate, data.startDate));
    }
    if (data?.endDate) {
      conditions.push(lte(expenses.expenseDate, data.endDate));
    }

    const rows = await db
      .select({
        id: expenses.id,
        tenantId: expenses.tenantId,
        branchId: expenses.branchId,
        branchName: branches.name,
        category: expenses.category,
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
        notes: expenses.notes,
        receiptUrl: expenses.receiptUrl,
        createdBy: expenses.createdBy,
        createdByName: staffUsers.name,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .leftJoin(branches, eq(expenses.branchId, branches.id))
      .leftJoin(staffUsers, eq(expenses.createdBy, staffUsers.id))
      .where(and(...conditions))
      .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));

    // Calculate totals per branch and category
    const branchTotals: Record<string, { name: string; total: number; count: number }> = {};
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    let grandTotal = 0;

    for (const row of rows) {
      const amt = Number(row.amount || 0);
      grandTotal += amt;

      // Branch total
      const bKey = row.branchId || "unassigned";
      const bName = row.branchName || "Main / Unassigned";
      if (!branchTotals[bKey]) {
        branchTotals[bKey] = { name: bName, total: 0, count: 0 };
      }
      branchTotals[bKey].total += amt;
      branchTotals[bKey].count += 1;

      // Category total
      const cKey = row.category;
      if (!categoryTotals[cKey]) {
        categoryTotals[cKey] = { total: 0, count: 0 };
      }
      categoryTotals[cKey].total += amt;
      categoryTotals[cKey].count += 1;
    }

    return {
      success: true,
      expenses: rows,
      grandTotal: Number(grandTotal.toFixed(2)),
      branchTotals,
      categoryTotals,
    };
  });

// ==========================================
// 3. SUPER ADMIN PLATFORM EXPENSES (tenant_id IS NULL)
// ==========================================

export const getPlatformExpensesFn = createServerFn({ method: "GET" })
  .validator((d?: {
    category?: string;
    startDate?: string;
    endDate?: string;
  }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      (sessionRes.session.role !== "Super Admin" && sessionRes.session.role !== "super_admin")
    ) {
      throw new Error("Unauthorized: Access restricted to Super Admin.");
    }

    let conditions = [isNull(expenses.tenantId)];

    if (data?.category && data.category !== "all") {
      conditions.push(eq(expenses.category, data.category));
    }
    if (data?.startDate) {
      conditions.push(gte(expenses.expenseDate, data.startDate));
    }
    if (data?.endDate) {
      conditions.push(lte(expenses.expenseDate, data.endDate));
    }

    const rows = await db
      .select({
        id: expenses.id,
        category: expenses.category,
        amount: expenses.amount,
        expenseDate: expenses.expenseDate,
        notes: expenses.notes,
        receiptUrl: expenses.receiptUrl,
        createdBy: expenses.createdBy,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
      })
      .from(expenses)
      .where(and(...conditions))
      .orderBy(desc(expenses.expenseDate), desc(expenses.createdAt));

    const total = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

    return {
      success: true,
      expenses: rows,
      total: Number(total.toFixed(2)),
    };
  });

export const createPlatformExpenseFn = createServerFn({ method: "POST" })
  .validator((d: {
    category: string;
    amount: number;
    expenseDate: string;
    notes?: string;
    receiptUrl?: string;
  }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      (sessionRes.session.role !== "Super Admin" && sessionRes.session.role !== "super_admin")
    ) {
      throw new Error("Unauthorized: Access restricted to Super Admin.");
    }

    if (!data.category || !EXPENSE_CATEGORIES.includes(data.category as ExpenseCategory)) {
      throw new Error("Invalid expense category.");
    }

    const numAmount = Number(data.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Expense amount must be greater than 0.");
    }

    if (!data.expenseDate || isNaN(new Date(data.expenseDate).getTime())) {
      throw new Error("Valid expense date is required.");
    }

    // Verify if Super Admin user id exists in staffUsers table before setting FK
    let createdById: string | null = null;
    const sessionUserId = sessionRes.session.id;
    if (sessionUserId) {
      const userRecord = await db.query.staffUsers.findFirst({
        where: eq(staffUsers.id, sessionUserId),
      });
      if (userRecord) {
        createdById = sessionUserId;
      }
    }

    const [created] = await db
      .insert(expenses)
      .values({
        tenantId: null,
        branchId: null,
        category: data.category,
        amount: String(numAmount.toFixed(2)),
        expenseDate: data.expenseDate,
        notes: data.notes?.trim() || null,
        receiptUrl: data.receiptUrl?.trim() || null,
        createdBy: createdById,
      })
      .returning();

    return { success: true, expense: created };
  });

export const updatePlatformExpenseFn = createServerFn({ method: "POST" })
  .validator((d: {
    id: string;
    category: string;
    amount: number;
    expenseDate: string;
    notes?: string;
    receiptUrl?: string;
  }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      (sessionRes.session.role !== "Super Admin" && sessionRes.session.role !== "super_admin")
    ) {
      throw new Error("Unauthorized: Access restricted to Super Admin.");
    }

    if (!data.category || !EXPENSE_CATEGORIES.includes(data.category as ExpenseCategory)) {
      throw new Error("Invalid expense category.");
    }

    const numAmount = Number(data.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error("Expense amount must be greater than 0.");
    }

    if (!data.expenseDate || isNaN(new Date(data.expenseDate).getTime())) {
      throw new Error("Valid expense date is required.");
    }

    const [updated] = await db
      .update(expenses)
      .set({
        category: data.category,
        amount: String(numAmount.toFixed(2)),
        expenseDate: data.expenseDate,
        notes: data.notes?.trim() || null,
        receiptUrl: data.receiptUrl !== undefined ? data.receiptUrl.trim() || null : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.id, data.id), isNull(expenses.tenantId)))
      .returning();

    if (!updated) {
      throw new Error("Platform expense not found.");
    }

    return { success: true, expense: updated };
  });

export const deletePlatformExpenseFn = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (
      !sessionRes.success ||
      !sessionRes.session ||
      (sessionRes.session.role !== "Super Admin" && sessionRes.session.role !== "super_admin")
    ) {
      throw new Error("Unauthorized: Access restricted to Super Admin.");
    }

    const [deleted] = await db
      .delete(expenses)
      .where(and(eq(expenses.id, data.id), isNull(expenses.tenantId)))
      .returning();

    if (!deleted) {
      throw new Error("Platform expense not found.");
    }

    return { success: true };
  });

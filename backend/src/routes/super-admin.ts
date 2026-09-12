import { Router } from "express";
import { db } from "../db/index.js";
import { eq, sql, and, or, ilike, ne } from "drizzle-orm";
import { tenants, branches, tenantInvoices, tenantSubscriptions, tenantSettings, staffUsers, tenantPayments } from "../db/schema.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import bcrypt from "bcryptjs";
import { createMamoPaymentLink } from "../lib/mamo-pay.js";


const router = Router();

// Middleware to enforce super_admin role
const requireSuperAdmin = (req: AuthRequest, res: any, next: any) => {
  const user = req.user;
  if (!user || user.role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden: Super Admin access required" });
  }
  next();
};

router.use(requireAuth, requireSuperAdmin);

/**
 * GET /api/super-admin/tenants
 * Lists all tenants with search, plan filter, status filter, and pagination.
 */
router.get("/tenants", async (req, res) => {
  try {
    const { search, plan, status } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search && typeof search === "string" && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(or(ilike(tenants.name, q), ilike(tenants.subdomain, q)));
    }

    if (plan && typeof plan === "string" && plan.trim() && plan.toLowerCase() !== "all") {
      conditions.push(ilike(tenants.plan, plan.trim()));
    }

    if (status && typeof status === "string" && status.trim() && status.toLowerCase() !== "all") {
      conditions.push(ilike(tenants.status, status.trim()));
    } else {
      conditions.push(ne(tenants.status, "Archived"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count for pagination
    const [countRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tenants)
      .where(whereClause);
    const total = countRes?.count || 0;

    const rows = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        subdomain: tenants.subdomain,
        plan: tenants.plan,
        status: tenants.status,
        outletLimit: tenants.outletLimit,
        tillLimit: tenants.tillLimit,
        createdAt: tenants.createdAt,
        branchCount: sql<number>`count(distinct ${branches.id})::int`,
        currentPeriodEndDate: sql<string | null>`(
          SELECT current_period_end_date 
          FROM tenant_subscriptions 
          WHERE tenant_id = ${tenants.id} 
          ORDER BY created_at DESC 
          LIMIT 1
        )`,
      })
      .from(tenants)
      .leftJoin(branches, eq(tenants.id, branches.tenantId))
      .where(whereClause)
      .groupBy(tenants.id)
      .orderBy(sql`${tenants.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    const formattedTenants = rows.map((t) => {
      let outletLimit = t.outletLimit;
      if (!outletLimit || outletLimit <= 0) {
        if (t.plan === "Growth") outletLimit = 10;
        else if (t.plan === "Enterprise") outletLimit = 999;
        else outletLimit = 2; // Starter default
      }

      return {
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        plan: t.plan,
        status: t.status,
        outletLimit,
        branchCount: t.branchCount || 0,
        currentPeriodEndDate: t.currentPeriodEndDate || null,
        createdAt: t.createdAt,
      };
    });

    res.json({
      success: true,
      tenants: formattedTenants,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Super admin fetch tenants error:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

/**
 * GET /api/super-admin/invoices
 * Lists all tenant_invoices with search, paymentStatus filter, plan filter, and pagination.
 */
router.get("/invoices", async (req, res) => {
  try {
    const { search, status, plan } = req.query;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search && typeof search === "string" && search.trim()) {
      const q = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(tenantInvoices.invoiceNumber, q),
          ilike(tenants.name, q),
          ilike(tenants.subdomain, q)
        )
      );
    }

    if (status && typeof status === "string" && status.trim() && status.toLowerCase() !== "all") {
      conditions.push(ilike(tenantInvoices.paymentStatus, status.trim()));
    }

    if (plan && typeof plan === "string" && plan.trim() && plan.toLowerCase() !== "all") {
      conditions.push(ilike(tenantInvoices.planName, plan.trim()));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count for pagination
    const [countRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tenantInvoices)
      .leftJoin(tenants, eq(tenantInvoices.tenantId, tenants.id))
      .where(whereClause);
    const total = countRes?.count || 0;

    const invoiceRows = await db
      .select({
        id: tenantInvoices.id,
        invoiceNumber: tenantInvoices.invoiceNumber,
        tenantId: tenantInvoices.tenantId,
        tenantName: tenants.name,
        tenantSubdomain: tenants.subdomain,
        planName: tenantInvoices.planName,
        billingCycle: tenantInvoices.billingCycle,
        durationMonths: tenantInvoices.durationMonths,
        subtotal: tenantInvoices.subtotal,
        vatAmount: tenantInvoices.vatAmount,
        totalAmount: tenantInvoices.totalAmount,
        currency: tenantInvoices.currency,
        paymentStatus: tenantInvoices.paymentStatus,
        paymentMethod: tenantInvoices.paymentMethod,
        mamoPaymentLinkId: tenantInvoices.mamoPaymentLinkId,
        mamoPaymentUrl: tenantInvoices.mamoPaymentUrl,
        periodStart: tenantInvoices.periodStart,
        periodEnd: tenantInvoices.periodEnd,
        createdAt: tenantInvoices.createdAt,
      })
      .from(tenantInvoices)
      .leftJoin(tenants, eq(tenantInvoices.tenantId, tenants.id))
      .where(whereClause)
      .orderBy(sql`${tenantInvoices.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      invoices: invoiceRows,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Super admin fetch invoices error:", error);
    res.status(500).json({ success: false, error: error.message || "Internal server error" });
  }
});

// Helper for billing cycle due date calculation
function calculateNextDueDate(startDate: Date, billingCycle: string, customDays?: number): Date {
  const nextDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  if (billingCycle === "quarterly") {
    nextDate.setMonth(nextDate.getMonth() + 3);
  } else if (billingCycle === "6_months") {
    nextDate.setMonth(nextDate.getMonth() + 6);
  } else if (billingCycle === "yearly") {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else if (billingCycle === "custom") {
    const days = customDays && customDays > 0 ? customDays : 30;
    nextDate.setDate(nextDate.getDate() + days);
  } else {
    // monthly default
    nextDate.setMonth(nextDate.getMonth() + 1);
  }
  return nextDate;
}

// Plan entitlements and pricing calculation
const PLAN_DATA: Record<string, { outletLimit: number; tillLimit: number; monthlyOrderLimit: number; monthlyPrice: number; annualPricePerMonth: number }> = {
  Starter: { outletLimit: 1, tillLimit: 3, monthlyOrderLimit: 10000, monthlyPrice: 899, annualPricePerMonth: 764 },
  Growth: { outletLimit: 10, tillLimit: 10, monthlyOrderLimit: 150000, monthlyPrice: 1690, annualPricePerMonth: 1437 },
  Enterprise: { outletLimit: 999, tillLimit: 999, monthlyOrderLimit: 1000000, monthlyPrice: 4999, annualPricePerMonth: 4249 },
};

function calculatePlanPricing(planName: string, billingCycle: string = "monthly", customDays?: number) {
  const plan = PLAN_DATA[planName] || PLAN_DATA.Starter;
  let durationMonths = 1;
  let subtotal = plan.monthlyPrice;

  if (billingCycle === "yearly") {
    durationMonths = 12;
    subtotal = plan.annualPricePerMonth * 12;
  } else if (billingCycle === "6_months") {
    durationMonths = 6;
    subtotal = plan.monthlyPrice * 6;
  } else if (billingCycle === "quarterly") {
    durationMonths = 3;
    subtotal = plan.monthlyPrice * 3;
  } else if (billingCycle === "custom") {
    const days = customDays && customDays > 0 ? customDays : 30;
    durationMonths = Math.max(1, Math.round(days / 30));
    subtotal = (plan.monthlyPrice / 30) * days;
  }

  const vatRate = 0.05;
  const vatAmount = Number((subtotal * vatRate).toFixed(2));
  const totalAmount = Number((subtotal + vatAmount).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    vatAmount,
    totalAmount,
    durationMonths,
  };
}

/**
 * POST /api/super-admin/tenants
 * Create Tenant with settings, primary admin, initial branch, subscription, and invoice.
 */
router.post("/tenants", async (req, res) => {
  try {
    const {
      name,
      subdomain,
      plan,
      billingCycle,
      customDays,
      outlets,
      tills,
      trn,
      adminName,
      adminEmail,
      adminPhone,
      adminAddress,
      adminPassword,
    } = req.body;

    if (!name || !subdomain || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, subdomain, adminName, adminEmail, adminPassword",
      });
    }

    const cleanSubdomain = subdomain.toLowerCase().trim();
    const cleanEmail = adminEmail.toLowerCase().trim();

    // Check if subdomain already exists
    const [existingSub] = await db.select().from(tenants).where(eq(tenants.subdomain, cleanSubdomain));
    if (existingSub) {
      return res.status(400).json({ success: false, error: "Subdomain already exists" });
    }

    // Check if admin email already exists
    const [existingUser] = await db.select().from(staffUsers).where(eq(staffUsers.email, cleanEmail));
    if (existingUser) {
      return res.status(400).json({ success: false, error: "Admin email already exists" });
    }

    const planName = plan || "Starter";
    const cycle = billingCycle || "monthly";
    const planMeta = PLAN_DATA[planName] || PLAN_DATA.Starter;
    const outletLimit = outlets && outlets > 0 ? outlets : planMeta.outletLimit;
    const tillLimit = tills && tills > 0 ? tills : planMeta.tillLimit;
    const monthlyOrderLimit = planMeta.monthlyOrderLimit;

    const result = await db.transaction(async (tx) => {
      // 1. Insert tenant
      const [newTenant] = await tx
        .insert(tenants)
        .values({
          name: name.trim(),
          subdomain: cleanSubdomain,
          plan: planName,
          status: "Active",
          outletLimit,
          tillLimit,
          monthlyOrderLimit,
        })
        .returning();

      // 2. Insert tenant_settings (TRN)
      await tx.insert(tenantSettings).values({
        tenantId: newTenant.id,
        taxRegistrationNumber: trn || null,
      });

      // 3. Insert primary Head Office Admin
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const [newAdmin] = await tx
        .insert(staffUsers)
        .values({
          tenantId: newTenant.id,
          branchId: null,
          name: adminName.trim(),
          email: cleanEmail,
          phone: adminPhone || null,
          address: adminAddress || null,
          passwordHash,
          role: "head_office_admin",
          isActive: true,
        })
        .returning();

      // 4. Create initial main branch
      const [mainBranch] = await tx
        .insert(branches)
        .values({
          tenantId: newTenant.id,
          name: `${name.trim()} - Main Branch`,
          address: adminAddress || "HQ",
          tillCount: 1,
          status: "Active",
        })
        .returning();

      // 5. Create initial subscription
      const subStartDate = new Date();
      const subEndDate = calculateNextDueDate(subStartDate, cycle, customDays);
      await tx.insert(tenantSubscriptions).values({
        tenantId: newTenant.id,
        billingCycle: cycle,
        customDays: customDays || null,
        subscriptionStartDate: subStartDate,
        currentPeriodEndDate: subEndDate,
        status: "active",
      });

      // 6. Create initial subscription invoice
      const pricing = calculatePlanPricing(planName, cycle, customDays);
      const invYear = subStartDate.getFullYear();
      const invRand = Math.floor(1000 + Math.random() * 9000);
      const invoiceNumber = `INV-SUB-${invYear}-${invRand}`;

      const [newInvoice] = await tx
        .insert(tenantInvoices)
        .values({
          invoiceNumber,
          tenantId: newTenant.id,
          planName,
          billingCycle: cycle,
          durationMonths: pricing.durationMonths,
          subtotal: pricing.subtotal.toFixed(2),
          vatAmount: pricing.vatAmount.toFixed(2),
          totalAmount: pricing.totalAmount.toFixed(2),
          currency: "AED",
          paymentStatus: "pending_gateway_integration",
          paymentMethod: "mamo_pay",
          periodStart: subStartDate,
          periodEnd: subEndDate,
        })
        .returning();

      return {
        tenant: newTenant,
        admin: { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email },
        branch: mainBranch,
        invoice: newInvoice,
      };
    });

    res.status(201).json({
      success: true,
      tenant: result.tenant,
      admin: result.admin,
      branch: result.branch,
      invoice: result.invoice,
    });
  } catch (error: any) {
    console.error("Super admin create tenant error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create tenant" });
  }
});

/**
 * PATCH /api/super-admin/tenants/:id
 * Edit tenant: name, plan, outletLimit, tillLimit, TRN.
 */
router.patch("/tenants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, plan, outletLimit, tillLimit, trn } = req.body;

    const [current] = await db.select().from(tenants).where(eq(tenants.id, id));
    if (!current) {
      return res.status(404).json({ success: false, error: "Tenant not found" });
    }

    const updates: any = {};
    if (name) updates.name = name.trim();
    if (plan) updates.plan = plan;
    if (outletLimit !== undefined && outletLimit > 0) updates.outletLimit = outletLimit;
    if (tillLimit !== undefined && tillLimit > 0) updates.tillLimit = tillLimit;

    if (Object.keys(updates).length > 0) {
      await db.update(tenants).set(updates).where(eq(tenants.id, id));
    }

    if (trn !== undefined) {
      const [existingSettings] = await db.select().from(tenantSettings).where(eq(tenantSettings.tenantId, id));
      if (existingSettings) {
        await db.update(tenantSettings).set({ taxRegistrationNumber: trn }).where(eq(tenantSettings.tenantId, id));
      } else {
        await db.insert(tenantSettings).values({ tenantId: id, taxRegistrationNumber: trn });
      }
    }

    const [updated] = await db.select().from(tenants).where(eq(tenants.id, id));
    res.json({ success: true, tenant: updated });
  } catch (error: any) {
    console.error("Super admin update tenant error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update tenant" });
  }
});

/**
 * PATCH /api/super-admin/tenants/:id/status
 * Suspend/Reactivate tenant status toggle.
 */
router.patch("/tenants/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [current] = await db.select().from(tenants).where(eq(tenants.id, id));
    if (!current) {
      return res.status(404).json({ success: false, error: "Tenant not found" });
    }

    let nextStatus = status;
    if (!nextStatus) {
      nextStatus = current.status === "Suspended" ? "Active" : "Suspended";
    }

    await db.update(tenants).set({ status: nextStatus }).where(eq(tenants.id, id));
    res.json({ success: true, status: nextStatus });
  } catch (error: any) {
    console.error("Super admin update tenant status error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update status" });
  }
});

/**
 * PATCH /api/super-admin/tenants/:id/archive
 * Archive Tenant (soft delete: sets status to 'Archived').
 */
router.patch("/tenants/:id/archive", async (req, res) => {
  try {
    const { id } = req.params;

    const [current] = await db.select().from(tenants).where(eq(tenants.id, id));
    if (!current) {
      return res.status(404).json({ success: false, error: "Tenant not found" });
    }

    await db.update(tenants).set({ status: "Archived" }).where(eq(tenants.id, id));
    res.json({ success: true, message: "Tenant successfully archived." });
  } catch (error: any) {
    console.error("Super admin archive tenant error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to archive tenant" });
  }
});

/**
 * GET /api/super-admin/tenants/:id/branches
 * List all active branches for a tenant.
 */
router.get("/tenants/:id/branches", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db
      .select()
      .from(branches)
      .where(and(eq(branches.tenantId, id), ne(branches.status, "Inactive")))
      .orderBy(branches.createdAt);

    res.json({ success: true, branches: rows });
  } catch (error: any) {
    console.error("Super admin fetch branches error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch branches" });
  }
});

/**
 * POST /api/super-admin/tenants/:id/branches
 * Add a new branch for a tenant, enforcing outletLimit.
 */
router.post("/tenants/:id/branches", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: "Branch name is required" });
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    if (!tenant) {
      return res.status(404).json({ success: false, error: "Tenant not found" });
    }

    // Count active branches
    const [branchCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(branches)
      .where(and(eq(branches.tenantId, id), ne(branches.status, "Inactive")));

    const currentCount = branchCountRes?.count || 0;
    const limit = tenant.outletLimit || 2;

    if (currentCount >= limit) {
      return res.status(400).json({
        success: false,
        error: `Outlet limit reached (${currentCount}/${limit}). Upgrade plan to add more branches.`,
      });
    }

    const [newBranch] = await db
      .insert(branches)
      .values({
        tenantId: id,
        name: name.trim(),
        address: address?.trim() || null,
        tillCount: 1,
        status: "Active",
      })
      .returning();

    res.status(201).json({ success: true, branch: newBranch });
  } catch (error: any) {
    console.error("Super admin add branch error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to add branch" });
  }
});

/**
 * PATCH /api/super-admin/tenants/:id/admin
 * Update primary Head Office Admin's name/email/phone.
 */
router.patch("/tenants/:id/admin", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const [admin] = await db
      .select()
      .from(staffUsers)
      .where(and(eq(staffUsers.tenantId, id), eq(staffUsers.role, "head_office_admin"), eq(staffUsers.isActive, true)))
      .limit(1);

    if (!admin) {
      return res.status(404).json({ success: false, error: "Primary tenant admin not found" });
    }

    const updates: any = {};
    if (name) updates.name = name.trim();
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      // Check if email taken by someone else
      const [existing] = await db
        .select()
        .from(staffUsers)
        .where(and(eq(staffUsers.email, cleanEmail), ne(staffUsers.id, admin.id)));
      if (existing) {
        return res.status(400).json({ success: false, error: "Email already in use by another user" });
      }
      updates.email = cleanEmail;
    }
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;

    if (Object.keys(updates).length > 0) {
      await db.update(staffUsers).set(updates).where(eq(staffUsers.id, admin.id));
    }

    const [updatedAdmin] = await db.select().from(staffUsers).where(eq(staffUsers.id, admin.id));
    res.json({
      success: true,
      admin: {
        id: updatedAdmin.id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        phone: updatedAdmin.phone,
        address: updatedAdmin.address,
      },
    });
  } catch (error: any) {
    console.error("Super admin update admin error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update admin" });
  }
});

// ==========================================
// BILLING STATUS & CLIENT SUBSCRIPTIONS
// ==========================================

function computeSubscriptionStatus(currentPeriodEndDate: Date | string | null): "active" | "due_soon" | "overdue" | "no_record" {
  if (!currentPeriodEndDate) return "no_record";
  const now = new Date();
  const endDate = new Date(currentPeriodEndDate);
  if (isNaN(endDate.getTime())) return "no_record";

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dueStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  if (todayStr > dueStr) {
    return "overdue";
  }

  const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();

  const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) {
    return "due_soon";
  }

  return "active";
}

/**
 * GET /api/super-admin/billing-status
 * Returns per-tenant billing cycle, current period end date (next due), total amount paid,
 * last payment date/amount, computed punctuality status, and summary KPIs.
 */
router.get("/billing-status", async (req, res) => {
  try {
    const tenantRows = await db
      .select()
      .from(tenants)
      .where(ne(tenants.status, "Archived"))
      .orderBy(sql`${tenants.createdAt} DESC`);
    const subRows = await db.select().from(tenantSubscriptions);
    const paymentRows = await db
      .select()
      .from(tenantPayments)
      .orderBy(sql`${tenantPayments.paymentDate} DESC`);

    let totalRevenue = 0;
    paymentRows.forEach((p) => {
      totalRevenue += Number(p.amount || 0);
    });

    const tenantBillingList = await Promise.all(
      tenantRows.map(async (t) => {
        const sub = subRows.find((s) => s.tenantId === t.id);
        const tPayments = paymentRows.filter((p) => p.tenantId === t.id);

        const computedStatus = sub ? computeSubscriptionStatus(sub.currentPeriodEndDate) : "no_record";

        if (sub && sub.status !== computedStatus) {
          await db
            .update(tenantSubscriptions)
            .set({ status: computedStatus, updatedAt: new Date() })
            .where(eq(tenantSubscriptions.id, sub.id));
        }

        const lastPayment = tPayments.length > 0 ? tPayments[0] : null;
        const totalPaid = tPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

        let punctuality = "Never Paid";
        if (computedStatus === "overdue" && sub?.currentPeriodEndDate) {
          const nowTime = new Date().setHours(0, 0, 0, 0);
          const dueTime = new Date(sub.currentPeriodEndDate).setHours(0, 0, 0, 0);
          const overdueDays = Math.max(1, Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24)));
          punctuality = `Overdue (${overdueDays} day${overdueDays > 1 ? "s" : ""})`;
        } else if (computedStatus === "due_soon" && sub?.currentPeriodEndDate) {
          const nowTime = new Date().setHours(0, 0, 0, 0);
          const dueTime = new Date(sub.currentPeriodEndDate).setHours(0, 0, 0, 0);
          const daysLeft = Math.max(0, Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24)));
          punctuality = `Due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
        } else if (lastPayment) {
          const pTime = new Date(lastPayment.paymentDate).setHours(0, 0, 0, 0);
          const sTime = new Date(lastPayment.periodCoveredStart).setHours(0, 0, 0, 0);
          const diffDays = Math.floor((pTime - sTime) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) {
            punctuality = `Paid Late (by ${diffDays} day${diffDays > 1 ? "s" : ""})`;
          } else {
            punctuality = "Paid / Up to date";
          }
        } else if (sub?.currentPeriodEndDate) {
          const nowTime = new Date().setHours(0, 0, 0, 0);
          const dueTime = new Date(sub.currentPeriodEndDate).setHours(0, 0, 0, 0);
          const daysLeft = Math.max(0, Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24)));
          punctuality = `Due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
        }

        return {
          tenantId: t.id,
          tenantName: t.name,
          subdomain: t.subdomain,
          plan: t.plan,
          status: computedStatus,
          punctuality,
          billingCycle: sub ? sub.billingCycle : null,
          customDays: sub ? sub.customDays : null,
          subscriptionStartDate: sub ? sub.subscriptionStartDate : null,
          currentPeriodEndDate: sub ? sub.currentPeriodEndDate : null,
          lastPaymentAmount: lastPayment ? Number(lastPayment.amount) : null,
          lastPaymentDate: lastPayment ? lastPayment.paymentDate : null,
          totalPaid,
          paymentCount: tPayments.length,
        };
      })
    );

    const overdueTenants = tenantBillingList.filter((t) => t.status === "overdue");
    const dueSoonTenants = tenantBillingList.filter((t) => t.status === "due_soon");

    const overview = {
      totalTenants: tenantRows.length,
      totalRevenueCollected: totalRevenue,
      overdueCount: overdueTenants.length,
      dueSoonCount: dueSoonTenants.length,
      totalOverdueAmount: overdueTenants.length,
    };

    res.json({
      success: true,
      overview,
      summary: overview,
      tenants: tenantBillingList,
    });
  } catch (error: any) {
    console.error("Fetch billing status error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch billing status" });
  }
});

/**
 * POST /api/super-admin/tenants/:id/payments
 * Record an offline payment: amount, payment date, billing cycle adjustment, notes.
 * Auto-extends tenant's current_period_end_date.
 */
router.post("/tenants/:id/payments", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentDate, billingCycle = "monthly", customDays, notes } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, error: "Valid payment amount is required" });
    }
    if (!paymentDate) {
      return res.status(400).json({ success: false, error: "Payment date is required" });
    }

    const pDate = new Date(paymentDate);
    if (isNaN(pDate.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid payment date format" });
    }

    const startDateForDueMath = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate());
    const periodCoveredStart = startDateForDueMath;
    const periodCoveredEnd = calculateNextDueDate(startDateForDueMath, billingCycle, customDays ? Number(customDays) : undefined);

    const recordedBy = (req.user as any)?.name || (req.user as any)?.email || "Super Admin";

    await db.transaction(async (tx) => {
      await tx.insert(tenantPayments).values({
        tenantId: id,
        amount: numAmount.toFixed(2),
        currency: "AED",
        paymentDate: pDate,
        periodCoveredStart,
        periodCoveredEnd,
        notes: notes || null,
        recordedBy,
      });

      const existingSub = await tx
        .select()
        .from(tenantSubscriptions)
        .where(eq(tenantSubscriptions.tenantId, id))
        .limit(1);

      const newStatus = computeSubscriptionStatus(periodCoveredEnd);

      if (existingSub.length > 0) {
        await tx
          .update(tenantSubscriptions)
          .set({
            billingCycle,
            customDays: customDays ? Number(customDays) : null,
            currentPeriodEndDate: periodCoveredEnd,
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(tenantSubscriptions.id, existingSub[0].id));
      } else {
        await tx.insert(tenantSubscriptions).values({
          tenantId: id,
          billingCycle,
          customDays: customDays ? Number(customDays) : null,
          subscriptionStartDate: pDate,
          currentPeriodEndDate: periodCoveredEnd,
          status: newStatus,
        });
      }
    });

    res.json({ success: true, message: "Payment recorded successfully" });
  } catch (error: any) {
    console.error("Record tenant payment error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to record payment" });
  }
});

/**
 * PATCH /api/super-admin/tenants/:id/due-date
 * Direct override of the next due date without recording a payment.
 */
router.patch("/tenants/:id/due-date", async (req, res) => {
  try {
    const { id } = req.params;
    const { newDueDate } = req.body;

    if (!newDueDate) {
      return res.status(400).json({ success: false, error: "New due date is required" });
    }

    const dueDate = new Date(newDueDate);
    if (isNaN(dueDate.getTime())) {
      return res.status(400).json({ success: false, error: "Invalid due date format" });
    }
    dueDate.setHours(0, 0, 0, 0);

    const newStatus = computeSubscriptionStatus(dueDate);

    await db.transaction(async (tx) => {
      const existingSub = await tx
        .select()
        .from(tenantSubscriptions)
        .where(eq(tenantSubscriptions.tenantId, id))
        .limit(1);

      if (existingSub.length > 0) {
        await tx
          .update(tenantSubscriptions)
          .set({
            currentPeriodEndDate: dueDate,
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(tenantSubscriptions.id, existingSub[0].id));
      } else {
        await tx.insert(tenantSubscriptions).values({
          tenantId: id,
          billingCycle: "monthly",
          subscriptionStartDate: new Date(),
          currentPeriodEndDate: dueDate,
          status: newStatus,
        });
      }
    });

    res.json({ success: true, message: "Due date updated successfully" });
  } catch (error: any) {
    console.error("Update tenant due date error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update due date" });
  }
});

/**
 * GET /api/super-admin/tenants/:id/payment-history
 * List all past tenant_payments records for one tenant.
 */
router.get("/tenants/:id/payment-history", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await db
      .select()
      .from(tenantPayments)
      .where(eq(tenantPayments.tenantId, id))
      .orderBy(sql`${tenantPayments.paymentDate} DESC`, sql`${tenantPayments.createdAt} DESC`);

    res.json({ success: true, payments: rows });
  } catch (error: any) {
    console.error("Fetch tenant payment history error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch payment history" });
  }
});

/**
 * POST /api/super-admin/invoices
 * Create Manual Invoice: tenantId, planName, billingCycle, custom pricing override option, periodStart/periodEnd.
 */
router.post("/invoices", async (req, res) => {
  try {
    const { tenantId, planName, billingCycle, customDays, customAmount, periodStart, periodEnd } = req.body;

    if (!tenantId) {
      return res.status(400).json({ success: false, error: "tenantId is required" });
    }

    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    if (!tenant) {
      return res.status(404).json({ success: false, error: "Tenant not found" });
    }

    const cycle = billingCycle || "monthly";
    const defaultPricing = calculatePlanPricing(planName || tenant.plan || "Starter", cycle, customDays);

    let subtotal = defaultPricing.subtotal;
    let vatAmount = defaultPricing.vatAmount;
    let totalAmount = defaultPricing.totalAmount;
    const durationMonths = defaultPricing.durationMonths;

    if (customAmount !== undefined && customAmount !== null && !isNaN(Number(customAmount)) && Number(customAmount) >= 0) {
      subtotal = Number(customAmount);
      vatAmount = Number((subtotal * 0.05).toFixed(2));
      totalAmount = Number((subtotal + vatAmount).toFixed(2));
    }

    const startDate = periodStart ? new Date(periodStart) : new Date();
    const endDate = periodEnd ? new Date(periodEnd) : calculateNextDueDate(startDate, cycle, customDays);

    const invYear = startDate.getFullYear();
    const invRand = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-SUB-${invYear}-${invRand}`;

    const [newInvoice] = await db
      .insert(tenantInvoices)
      .values({
        invoiceNumber,
        tenantId,
        planName: planName || tenant.plan || "Starter",
        billingCycle: cycle,
        durationMonths,
        subtotal: subtotal.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        currency: "AED",
        paymentStatus: "pending_gateway_integration",
        paymentMethod: "mamo_pay",
        periodStart: startDate,
        periodEnd: endDate,
      })
      .returning();

    res.json({ success: true, invoice: newInvoice });
  } catch (error: any) {
    console.error("Create invoice error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to create invoice" });
  }
});

/**
 * PATCH /api/super-admin/invoices/:id
 * Edit Invoice: updates plan, cycle, custom pricing, dates.
 * Must REJECT if payment_status is paid or manual_paid.
 */
router.patch("/invoices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [invoice] = await db.select().from(tenantInvoices).where(eq(tenantInvoices.id, id)).limit(1);

    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    if (invoice.paymentStatus === "paid" || invoice.paymentStatus === "manual_paid") {
      return res.status(400).json({
        success: false,
        error: "Cannot edit a settled or paid subscription invoice for financial audit and accounting integrity.",
      });
    }

    const planName = req.body.planName || invoice.planName;
    const cycle = req.body.billingCycle || invoice.billingCycle || "monthly";
    const planToCompute = planName === "Custom" ? "Starter" : planName;
    const defaultPricing = calculatePlanPricing(planToCompute, cycle, req.body.customDays);

    let subtotal = defaultPricing.subtotal;
    let vatAmount = defaultPricing.vatAmount;
    let totalAmount = defaultPricing.totalAmount;
    const durationMonths = defaultPricing.durationMonths;

    const effectiveCustomAmount = req.body.customAmount ?? req.body.subtotal;
    if (effectiveCustomAmount !== undefined && effectiveCustomAmount !== null && !isNaN(Number(effectiveCustomAmount)) && Number(effectiveCustomAmount) >= 0) {
      subtotal = Number(effectiveCustomAmount);
      vatAmount = Number((subtotal * 0.05).toFixed(2));
      totalAmount = Number((subtotal + vatAmount).toFixed(2));
    } else if (req.body.totalAmount !== undefined && req.body.totalAmount !== null && !isNaN(Number(req.body.totalAmount)) && Number(req.body.totalAmount) >= 0) {
      totalAmount = Number(req.body.totalAmount);
      vatAmount = req.body.vatAmount !== undefined ? Number(req.body.vatAmount) : Number((totalAmount - totalAmount / 1.05).toFixed(2));
      subtotal = Number((totalAmount - vatAmount).toFixed(2));
    }

    const startDate = req.body.periodStart ? new Date(req.body.periodStart) : new Date(invoice.periodStart);
    const endDate = req.body.periodEnd ? new Date(req.body.periodEnd) : calculateNextDueDate(startDate, cycle, req.body.customDays);

    const [updatedInvoice] = await db
      .update(tenantInvoices)
      .set({
        planName,
        billingCycle: cycle,
        durationMonths,
        subtotal: subtotal.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        periodStart: startDate,
        periodEnd: endDate,
        mamoPaymentLinkId: null,
        mamoPaymentUrl: null,
      })
      .where(eq(tenantInvoices.id, id))
      .returning();

    res.json({ success: true, invoice: updatedInvoice });
  } catch (error: any) {
    console.error("Update invoice error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update invoice" });
  }
});

/**
 * DELETE /api/super-admin/invoices/:id
 * Delete Invoice: must REJECT if payment_status is paid or manual_paid.
 */
router.delete("/invoices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [invoice] = await db.select().from(tenantInvoices).where(eq(tenantInvoices.id, id)).limit(1);

    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    if (invoice.paymentStatus === "paid" || invoice.paymentStatus === "manual_paid") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete a settled or paid subscription invoice for financial audit and accounting integrity.",
      });
    }

    await db.delete(tenantInvoices).where(eq(tenantInvoices.id, id));

    res.json({ success: true, message: `Invoice ${invoice.invoiceNumber} deleted successfully.` });
  } catch (error: any) {
    console.error("Delete invoice error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to delete invoice" });
  }
});

/**
 * POST /api/super-admin/invoices/:id/generate-link
 * Generates/regenerates a Mamo Pay payment link and stores it on the invoice.
 */
router.post("/invoices/:id/generate-link", async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceResult = await db
      .select({
        id: tenantInvoices.id,
        invoiceNumber: tenantInvoices.invoiceNumber,
        tenantId: tenantInvoices.tenantId,
        tenantName: tenants.name,
        tenantSubdomain: tenants.subdomain,
        planName: tenantInvoices.planName,
        billingCycle: tenantInvoices.billingCycle,
        totalAmount: tenantInvoices.totalAmount,
        currency: tenantInvoices.currency,
        paymentStatus: tenantInvoices.paymentStatus,
        mamoPaymentLinkId: tenantInvoices.mamoPaymentLinkId,
        mamoPaymentUrl: tenantInvoices.mamoPaymentUrl,
      })
      .from(tenantInvoices)
      .leftJoin(tenants, eq(tenantInvoices.tenantId, tenants.id))
      .where(eq(tenantInvoices.id, id))
      .limit(1);

    const invoice = invoiceResult[0];
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    if (invoice.paymentStatus === "paid" || invoice.paymentStatus === "manual_paid") {
      return res.status(400).json({ success: false, error: "Invoice is already paid and settled." });
    }

    const linkResult = await createMamoPaymentLink({
      title: `Subscription - ${invoice.tenantName || "Cloudynation POS"}`,
      description: `Tax Invoice ${invoice.invoiceNumber} (${invoice.planName} plan)`,
      amount: Number(invoice.totalAmount),
      currency: invoice.currency || "AED",
      externalId: invoice.invoiceNumber,
      customData: {
        invoiceId: invoice.id,
        tenantId: invoice.tenantId,
        invoiceNumber: invoice.invoiceNumber,
      },
      returnUrl: `https://${invoice.tenantSubdomain || "app"}.cloudynationpos.com`,
      failureUrl: `https://${invoice.tenantSubdomain || "app"}.cloudynationpos.com`,
    });

    if (!linkResult.success || !linkResult.paymentUrl) {
      return res.status(400).json({
        success: false,
        error: linkResult.error || "Failed to generate Mamo Pay payment link",
      });
    }

    await db
      .update(tenantInvoices)
      .set({
        mamoPaymentLinkId: linkResult.paymentLinkId || null,
        mamoPaymentUrl: linkResult.paymentUrl || null,
      })
      .where(eq(tenantInvoices.id, invoice.id));

    res.json({
      success: true,
      paymentUrl: linkResult.paymentUrl,
      paymentLinkId: linkResult.paymentLinkId,
    });
  } catch (error: any) {
    console.error("Generate invoice payment link error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate payment link" });
  }
});

// Helper to generate styled HTML for branded Tax Invoice PDF
function buildInvoiceHtml(inv: any): string {
  const issueDate = inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";
  const dueDate = inv.periodEnd ? new Date(inv.periodEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";
  const startDateStr = inv.periodStart ? new Date(inv.periodStart).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const endDateStr = inv.periodEnd ? new Date(inv.periodEnd).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const coverageText = startDateStr && endDateStr ? `${startDateStr} to ${endDateStr}` : "Standard Period";
  const currency = inv.currency || "AED";
  
  const subtotalNum = Number(inv.subtotal || 0);
  const vatNum = Number(inv.vatAmount || 0);
  const totalNum = Number(inv.totalAmount || 0);
  const durationMonths = Number(inv.durationMonths || 1);

  const subtotalFormatted = subtotalNum.toFixed(2);
  const vatFormatted = vatNum.toFixed(2);
  const totalFormatted = totalNum.toFixed(2);
  const rateFormatted = durationMonths > 0 ? (subtotalNum / durationMonths).toFixed(2) : subtotalFormatted;

  const isPaid = inv.paymentStatus === "paid" || inv.paymentStatus === "manual_paid";
  const isOverdue = inv.paymentStatus === "overdue";

  const statusFormatted = inv.paymentStatus ? String(inv.paymentStatus).toUpperCase().replace(/_/g, " ") : "PENDING GATEWAY INTEGRATION";
  const methodFormatted = inv.paymentMethod ? String(inv.paymentMethod).toUpperCase().replace(/_/g, " ") : "MAMO PAY";

  let statusBannerStyle = "background-color: #ffffff; border: 1.5px solid #f59e0b; color: #d97706;";
  let statusBannerText = `PAYMENT STATUS: ${statusFormatted} (${methodFormatted})`;

  if (isPaid) {
    statusBannerStyle = "background-color: #f0fdf4; border: 1.5px solid #39ff14; color: #166534;";
    statusBannerText = "PAYMENT STATUS: PAID &amp; SETTLED";
  } else if (isOverdue) {
    statusBannerStyle = "background-color: #fef2f2; border: 1.5px solid #ef4444; color: #b91c1c;";
    statusBannerText = "PAYMENT STATUS: OVERDUE - PAYMENT REQUIRED";
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice - ${inv.invoiceNumber}</title>
  <style>
    @page { size: A4; margin: 15mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      padding: 24px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }
    .logo-pills {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-right: 6px;
    }
    .pill {
      width: 6px;
      height: 22px;
      border-radius: 3px;
    }
    .pill-lime { background-color: #39ff14; }
    .pill-dark { background-color: #111827; }
    .brand-text {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .brand-text span {
      color: #39ff14;
    }
    .company-info {
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
    }
    .invoice-title-block {
      text-align: right;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .meta-row {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 16px 0 20px 0;
    }
    .meta-columns {
      display: flex;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .col-left {
      flex: 1.2;
    }
    .col-right {
      flex: 1;
    }
    .col-title {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 6px;
    }
    .tenant-name {
      font-size: 14px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 2px;
    }
    .detail-line {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    .invoice-table thead tr {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #e2e8f0;
    }
    .invoice-table th {
      font-size: 11px;
      font-weight: 700;
      color: #111827;
      padding: 10px 8px;
      text-align: left;
      letter-spacing: 0.5px;
    }
    .invoice-table th.right {
      text-align: right;
    }
    .invoice-table tbody tr {
      border-bottom: 1px solid #e2e8f0;
    }
    .invoice-table td {
      padding: 14px 8px;
      font-size: 12.5px;
      color: #111827;
    }
    .invoice-table td.right {
      text-align: right;
    }
    .totals-section {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-top: 16px;
    }
    .totals-row {
      display: flex;
      justify-content: flex-end;
      gap: 24px;
      font-size: 12.5px;
      color: #64748b;
      margin-bottom: 6px;
      width: 320px;
    }
    .totals-row span:last-child {
      color: #111827;
      min-width: 110px;
      text-align: right;
    }
    .total-due-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      width: 320px;
      margin-top: 6px;
    }
    .total-due-label {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
    }
    .total-due-val {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
    }
    .status-banner {
      margin-top: 40px;
      border-radius: 8px;
      padding: 12px 18px;
      text-align: center;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .footer-divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 40px 0 14px 0;
    }
    .footer-text {
      text-align: center;
      font-size: 10.5px;
      color: #94a3b8;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div>
      <div class="brand-wrap">
        <div class="logo-pills">
          <div class="pill pill-lime"></div>
          <div class="pill pill-dark"></div>
        </div>
        <div class="brand-text">cloudynation<span>pos</span></div>
      </div>
      <div class="company-info">
        Cloudynation POS<br />
        License No.: CWS-1V-227668<br />
        26th Floor, Amber Gem Tower, Ajman, UAE<br />
        Info@cloudynationpos.com | +971 55 217 7186 | www.cloudynationpos.com
      </div>
    </div>
    <div class="invoice-title-block">
      <div class="doc-title">TAX INVOICE</div>
      <div class="meta-row">Invoice Ref: ${inv.invoiceNumber}</div>
      <div class="meta-row">Issued Date: ${issueDate}</div>
      <div class="meta-row">Period Due: ${dueDate}</div>
    </div>
  </div>

  <div class="divider"></div>

  <!-- Billed To & Subscription Details -->
  <div class="meta-columns">
    <div class="col-left">
      <div class="col-title">Billed To (Tenant Account):</div>
      <div class="tenant-name">${inv.tenantName || "Tenant Account"}</div>
      ${inv.tenantSubdomain ? `<div class="detail-line">Domain: ${inv.tenantSubdomain}.cloudynationpos.com</div>` : ""}
      ${inv.tenantTrn ? `<div class="detail-line">TRN: ${inv.tenantTrn}</div>` : ""}
      ${inv.adminName ? `<div class="detail-line">Contact: ${inv.adminName}</div>` : ""}
      ${inv.adminEmail ? `<div class="detail-line">Email: ${inv.adminEmail}</div>` : ""}
      ${inv.adminPhone ? `<div class="detail-line">Phone: ${inv.adminPhone}</div>` : ""}
    </div>
    <div class="col-right">
      <div class="col-title">Subscription Details:</div>
      <div class="detail-line">Plan Tier: ${inv.planName}</div>
      <div class="detail-line">Billing Cycle: ${(inv.billingCycle || "monthly").toUpperCase().replace(/_/g, " ")}</div>
      <div class="detail-line">Coverage: ${coverageText}</div>
      <div class="detail-line">Payment Status: ${statusFormatted}</div>
      <div class="detail-line">Payment Gateway: ${methodFormatted}</div>
    </div>
  </div>

  <!-- Line Items Table -->
  <table class="invoice-table">
    <thead>
      <tr>
        <th style="width: 50%;">PLAN DESCRIPTION</th>
        <th class="right" style="width: 16%;">DURATION</th>
        <th class="right" style="width: 17%;">RATE (${currency})</th>
        <th class="right" style="width: 17%;">SUBTOTAL (${currency})</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${inv.planName} Tier SaaS Subscription (${(inv.billingCycle || "monthly").replace(/_/g, " ")})</td>
        <td class="right">${durationMonths} Month${durationMonths > 1 ? "s" : ""}</td>
        <td class="right">${rateFormatted}</td>
        <td class="right">${subtotalFormatted}</td>
      </tr>
    </tbody>
  </table>

  <!-- Totals Section -->
  <div class="totals-section">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${subtotalFormatted} ${currency}</span>
    </div>
    <div class="totals-row">
      <span>UAE VAT (5.00%):</span>
      <span>${vatFormatted} ${currency}</span>
    </div>
    <div class="total-due-box">
      <span class="total-due-label">Total Due:</span>
      <span class="total-due-val">${totalFormatted} ${currency}</span>
    </div>
  </div>

  <!-- Bottom Payment Status Box -->
  <div class="status-banner" style="${statusBannerStyle}">
    ${statusBannerText}
  </div>

  <div class="footer-divider"></div>
  <div class="footer-text">
    Electronically generated Tax Invoice - Cloudynation POS SaaS Platform - Ajman, UAE<br />
    License: CWS-1V-227668 - Info@cloudynationpos.com - www.cloudynationpos.com
  </div>
</body>
</html>`;
}

/**
 * GET /api/super-admin/invoices/:id/pdf
 * Returns full invoice details and branded HTML markup ready for native PDF conversion.
 */
router.get("/invoices/:id/pdf", async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceResult = await db
      .select({
        id: tenantInvoices.id,
        invoiceNumber: tenantInvoices.invoiceNumber,
        tenantId: tenantInvoices.tenantId,
        tenantName: tenants.name,
        tenantSubdomain: tenants.subdomain,
        planName: tenantInvoices.planName,
        billingCycle: tenantInvoices.billingCycle,
        durationMonths: tenantInvoices.durationMonths,
        subtotal: tenantInvoices.subtotal,
        vatAmount: tenantInvoices.vatAmount,
        totalAmount: tenantInvoices.totalAmount,
        currency: tenantInvoices.currency,
        paymentStatus: tenantInvoices.paymentStatus,
        paymentMethod: tenantInvoices.paymentMethod,
        periodStart: tenantInvoices.periodStart,
        periodEnd: tenantInvoices.periodEnd,
        createdAt: tenantInvoices.createdAt,
      })
      .from(tenantInvoices)
      .leftJoin(tenants, eq(tenantInvoices.tenantId, tenants.id))
      .where(eq(tenantInvoices.id, id))
      .limit(1);

    const invoice = invoiceResult[0];
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    // Fetch tenant settings for TRN & primary admin user
    const [settings] = await db
      .select()
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, invoice.tenantId))
      .limit(1);

    const [adminUser] = await db
      .select()
      .from(staffUsers)
      .where(and(eq(staffUsers.tenantId, invoice.tenantId), eq(staffUsers.role, "head_office_admin")))
      .limit(1);

    const fullInvoiceData = {
      ...invoice,
      tenantTrn: settings?.taxRegistrationNumber || undefined,
      adminName: adminUser?.name || undefined,
      adminEmail: adminUser?.email || undefined,
      adminPhone: adminUser?.phone || undefined,
    };

    const html = buildInvoiceHtml(fullInvoiceData);

    res.json({
      success: true,
      invoice: fullInvoiceData,
      html,
    });
  } catch (error: any) {
    console.error("Get invoice PDF error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate invoice PDF" });
  }
});

export default router;


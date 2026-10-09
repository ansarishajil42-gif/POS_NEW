import { Router } from "express";
import { db } from "../db/index.js";
import {
  branchReportSubmissions,
  branches,
  staffUsers,
} from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { aliasedTable } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import {
  computeExecutiveSummaryData,
  computeSalesMarginData,
  parseDateRange,
} from "./financial-reports.js";

const router = Router();
router.use(requireAuth);

/**
 * Format string or Date object into PostgreSQL YYYY-MM-DD date string.
 */
function toSqlDate(d: string | Date): string {
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return d;
  }
  const dateObj = new Date(d);
  if (isNaN(dateObj.getTime())) {
    return new Date().toISOString().split("T")[0];
  }
  return dateObj.toISOString().split("T")[0];
}

/**
 * Role check helpers
 */
function isBranchManagerRole(role?: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "branch_manager" || r === "branch manager" || r === "store-manager" || r === "store_manager";
}

function isHeadOfficeRole(role?: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return r === "head_office_admin" || r === "head office admin" || r === "super_admin" || r === "super admin";
}

/**
 * 1. GET /api/branch-reports/my-branch-report
 * Branch Manager only. branchId forced strictly from session (req.user.branchId).
 * Reuses Executive Summary + Sales & Margin calculation logic from financial-reports.ts.
 */
router.get("/my-branch-report", async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const branchId = req.user?.branchId;
    const role = req.user?.role;

    if (!tenantId) {
      return res.status(403).json({ success: false, error: "Forbidden: No tenant associated with session" });
    }

    if (!branchId || !isBranchManagerRole(role)) {
      return res.status(403).json({ success: false, error: "Forbidden: Access restricted to Branch Managers assigned to a branch" });
    }

    const { startDate, endDate } = req.query;
    const { sDate, eDate } = parseDateRange(startDate, endDate);

    // Fetch branch info
    const [branch] = await db
      .select({ id: branches.id, name: branches.name, address: branches.address })
      .from(branches)
      .where(and(eq(branches.id, branchId), eq(branches.tenantId, tenantId)));

    if (!branch) {
      return res.status(404).json({ success: false, error: "Branch not found" });
    }

    // Execute calculations strictly scoped to this tenant and branch
    const [executiveSummary, salesMargin] = await Promise.all([
      computeExecutiveSummaryData(tenantId, branchId, sDate, eDate),
      computeSalesMarginData(tenantId, branchId, sDate, eDate),
    ]);

    res.json({
      success: true,
      data: {
        branch: {
          id: branch.id,
          name: branch.name,
          address: branch.address,
        },
        periodStart: toSqlDate(sDate),
        periodEnd: toSqlDate(eDate),
        executiveSummary,
        salesMargin,
      },
    });
  } catch (error: any) {
    console.error("Failed to generate branch financial report:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to generate report" });
  }
});

/**
 * 2. POST /api/branch-reports/submit (and alias POST /submit)
 * Branch Manager submits a report with frozen snapshot data.
 */
const handleSubmitReport = async (req: AuthRequest, res: any) => {
  try {
    const tenantId = req.user?.tenantId;
    const branchId = req.user?.branchId;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!tenantId || !branchId || !userId || !isBranchManagerRole(role)) {
      return res.status(403).json({ success: false, error: "Forbidden: Access restricted to Branch Managers" });
    }

    const { startDate, endDate, notes } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: "Both startDate and endDate are required" });
    }

    const { sDate, eDate } = parseDateRange(startDate, endDate);
    const sDateStr = toSqlDate(sDate);
    const eDateStr = toSqlDate(eDate);

    // Fetch branch name
    const [branch] = await db
      .select({ id: branches.id, name: branches.name })
      .from(branches)
      .where(and(eq(branches.id, branchId), eq(branches.tenantId, tenantId)));

    if (!branch) {
      return res.status(404).json({ success: false, error: "Branch not found" });
    }

    // Compute frozen snapshot
    const [executiveSummary, salesMargin] = await Promise.all([
      computeExecutiveSummaryData(tenantId, branchId, sDate, eDate),
      computeSalesMarginData(tenantId, branchId, sDate, eDate),
    ]);

    const snapshotData = {
      branchId,
      branchName: branch.name,
      submittedById: userId,
      periodStart: sDateStr,
      periodEnd: eDateStr,
      computedAt: new Date().toISOString(),
      executiveSummary,
      salesMargin,
    };

    const [submission] = await db
      .insert(branchReportSubmissions)
      .values({
        tenantId,
        branchId,
        submittedBy: userId,
        periodStart: sDateStr,
        periodEnd: eDateStr,
        snapshotData,
        notes: notes?.trim() || null,
        status: "submitted",
      })
      .returning();

    res.json({
      success: true,
      submissionId: submission.id,
      message: "Branch report submitted successfully to Head Office",
    });
  } catch (error: any) {
    console.error("Failed to submit branch report:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to submit report" });
  }
};

router.post("/submit", handleSubmitReport);
router.post("/branch-reports/submit", handleSubmitReport);

/**
 * 3. GET /api/branch-reports/mine
 * Branch Manager's own submission history (strictly scoped to session tenantId + branchId).
 */
router.get("/mine", async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const branchId = req.user?.branchId;
    const role = req.user?.role;

    if (!tenantId || !branchId || !isBranchManagerRole(role)) {
      return res.status(403).json({ success: false, error: "Forbidden: Access restricted to Branch Managers" });
    }

    const reviewerStaff = aliasedTable(staffUsers, "reviewer_staff");
    const submitterStaff = aliasedTable(staffUsers, "submitter_staff");

    const rows = await db
      .select({
        id: branchReportSubmissions.id,
        tenantId: branchReportSubmissions.tenantId,
        branchId: branchReportSubmissions.branchId,
        branchName: branches.name,
        submittedBy: branchReportSubmissions.submittedBy,
        submitterName: submitterStaff.name,
        submitterEmail: submitterStaff.email,
        periodStart: branchReportSubmissions.periodStart,
        periodEnd: branchReportSubmissions.periodEnd,
        snapshotData: branchReportSubmissions.snapshotData,
        notes: branchReportSubmissions.notes,
        status: branchReportSubmissions.status,
        headOfficeMessage: branchReportSubmissions.headOfficeMessage,
        reviewedBy: branchReportSubmissions.reviewedBy,
        reviewedAt: branchReportSubmissions.reviewedAt,
        reviewerName: reviewerStaff.name,
        createdAt: branchReportSubmissions.createdAt,
      })
      .from(branchReportSubmissions)
      .innerJoin(branches, eq(branchReportSubmissions.branchId, branches.id))
      .leftJoin(submitterStaff, eq(branchReportSubmissions.submittedBy, submitterStaff.id))
      .leftJoin(reviewerStaff, eq(branchReportSubmissions.reviewedBy, reviewerStaff.id))
      .where(
        and(
          eq(branchReportSubmissions.tenantId, tenantId),
          eq(branchReportSubmissions.branchId, branchId)
        )
      )
      .orderBy(desc(branchReportSubmissions.createdAt));

    res.json({
      success: true,
      submissions: rows,
    });
  } catch (error: any) {
    console.error("Failed to fetch branch manager submissions:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch submission history" });
  }
});

/**
 * 6. GET /api/branch-reports/all
 * Head Office Admin view: all submissions across branches, tenant-scoped.
 */
router.get("/all", async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;

    if (!tenantId || !isHeadOfficeRole(role)) {
      return res.status(403).json({ success: false, error: "Forbidden: Access restricted to Head Office Admin" });
    }

    const { branchId, status } = req.query;

    const reviewerStaff = aliasedTable(staffUsers, "reviewer_staff");
    const submitterStaff = aliasedTable(staffUsers, "submitter_staff");

    const conditions = [eq(branchReportSubmissions.tenantId, tenantId)];
    if (branchId && typeof branchId === "string" && branchId !== "all") {
      conditions.push(eq(branchReportSubmissions.branchId, branchId));
    }
    if (status && typeof status === "string" && status !== "all") {
      conditions.push(eq(branchReportSubmissions.status, status));
    }

    const rows = await db
      .select({
        id: branchReportSubmissions.id,
        tenantId: branchReportSubmissions.tenantId,
        branchId: branchReportSubmissions.branchId,
        branchName: branches.name,
        submittedBy: branchReportSubmissions.submittedBy,
        submitterName: submitterStaff.name,
        submitterEmail: submitterStaff.email,
        periodStart: branchReportSubmissions.periodStart,
        periodEnd: branchReportSubmissions.periodEnd,
        snapshotData: branchReportSubmissions.snapshotData,
        notes: branchReportSubmissions.notes,
        status: branchReportSubmissions.status,
        headOfficeMessage: branchReportSubmissions.headOfficeMessage,
        reviewedBy: branchReportSubmissions.reviewedBy,
        reviewedAt: branchReportSubmissions.reviewedAt,
        reviewerName: reviewerStaff.name,
        createdAt: branchReportSubmissions.createdAt,
      })
      .from(branchReportSubmissions)
      .innerJoin(branches, eq(branchReportSubmissions.branchId, branches.id))
      .leftJoin(submitterStaff, eq(branchReportSubmissions.submittedBy, submitterStaff.id))
      .leftJoin(reviewerStaff, eq(branchReportSubmissions.reviewedBy, reviewerStaff.id))
      .where(and(...conditions))
      .orderBy(desc(branchReportSubmissions.createdAt));

    res.json({
      success: true,
      submissions: rows,
    });
  } catch (error: any) {
    console.error("Failed to fetch all branch submissions:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to fetch submissions" });
  }
});

/**
 * 7. POST /api/branch-reports/:id/approve
 * Head Office Admin approves a branch report submission (sets status 'reviewed', locks it).
 */
router.post("/:id/approve", async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!tenantId || !userId || !isHeadOfficeRole(role)) {
      return res.status(403).json({ success: false, error: "Forbidden: Access restricted to Head Office Admin" });
    }

    const [updated] = await db
      .update(branchReportSubmissions)
      .set({
        status: "reviewed",
        reviewedBy: userId,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(branchReportSubmissions.id, id),
          eq(branchReportSubmissions.tenantId, tenantId)
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ success: false, error: "Submission not found or unauthorized" });
    }

    res.json({
      success: true,
      message: "Branch report approved and locked",
      submission: updated,
    });
  } catch (error: any) {
    console.error("Failed to approve submission:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to approve submission" });
  }
});

/**
 * 8. POST /api/branch-reports/:id/return
 * Head Office Admin returns a branch report with a required feedback message.
 */
router.post("/:id/return", async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;
    const { message } = req.body;

    if (!tenantId || !userId || !isHeadOfficeRole(role)) {
      return res.status(403).json({ success: false, error: "Forbidden: Access restricted to Head Office Admin" });
    }

    const msg = message?.trim();
    if (!msg) {
      return res.status(400).json({ success: false, error: "A return message or reason is required" });
    }

    const [existing] = await db
      .select()
      .from(branchReportSubmissions)
      .where(
        and(
          eq(branchReportSubmissions.id, id),
          eq(branchReportSubmissions.tenantId, tenantId)
        )
      );

    if (!existing) {
      return res.status(404).json({ success: false, error: "Submission not found" });
    }

    if (existing.status === "reviewed") {
      return res.status(400).json({ success: false, error: "Locked: This report has already been reviewed and approved" });
    }

    const [updated] = await db
      .update(branchReportSubmissions)
      .set({
        status: "returned",
        headOfficeMessage: msg,
        reviewedBy: userId,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(branchReportSubmissions.id, id),
          eq(branchReportSubmissions.tenantId, tenantId)
        )
      )
      .returning();

    res.json({
      success: true,
      message: "Branch report returned with feedback",
      submission: updated,
    });
  } catch (error: any) {
    console.error("Failed to return submission:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to return submission" });
  }
});

/**
 * 4. PATCH /api/branch-reports/:id
 * Branch Manager edits their OWN submission (notes/resubmit), ONLY if status is 'submitted' or 'returned'.
 */
router.patch("/:id", async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const branchId = req.user?.branchId;
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!tenantId || !branchId || !userId || !isBranchManagerRole(role)) {
      return res.status(403).json({ success: false, error: "Forbidden: Access restricted to Branch Managers" });
    }

    const [existing] = await db
      .select()
      .from(branchReportSubmissions)
      .where(
        and(
          eq(branchReportSubmissions.id, id),
          eq(branchReportSubmissions.tenantId, tenantId)
        )
      );

    if (!existing) {
      return res.status(404).json({ success: false, error: "Submission not found" });
    }

    if (existing.branchId !== branchId || existing.submittedBy !== userId) {
      return res.status(403).json({ success: false, error: "Forbidden: You can only edit your own branch submissions" });
    }

    if (existing.status === "reviewed") {
      return res.status(400).json({ success: false, error: "Locked: Reviewed reports cannot be edited" });
    }

    if (existing.status !== "submitted" && existing.status !== "returned") {
      return res.status(400).json({ success: false, error: `Cannot edit submission in '${existing.status}' status` });
    }

    const { notes, startDate, endDate } = req.body;
    const periodStart = startDate || existing.periodStart;
    const periodEnd = endDate || existing.periodEnd;

    const updates: Record<string, any> = {
      notes: notes !== undefined ? (notes?.trim() || null) : existing.notes,
      status: "submitted",
      headOfficeMessage: null, // Clear return message upon resubmission
    };

    // Re-snapshot financial data if date boundaries changed
    if (startDate || endDate) {
      const { sDate, eDate } = parseDateRange(periodStart, periodEnd);
      const [executiveSummary, salesMargin] = await Promise.all([
        computeExecutiveSummaryData(tenantId, branchId, sDate, eDate),
        computeSalesMarginData(tenantId, branchId, sDate, eDate),
      ]);

      const [branch] = await db
        .select({ id: branches.id, name: branches.name })
        .from(branches)
        .where(and(eq(branches.id, branchId), eq(branches.tenantId, tenantId)));

      updates.periodStart = toSqlDate(sDate);
      updates.periodEnd = toSqlDate(eDate);
      updates.snapshotData = {
        branchId,
        branchName: branch?.name || "Branch",
        submittedById: userId,
        periodStart: toSqlDate(sDate),
        periodEnd: toSqlDate(eDate),
        computedAt: new Date().toISOString(),
        executiveSummary,
        salesMargin,
      };
    }

    const [updated] = await db
      .update(branchReportSubmissions)
      .set(updates)
      .where(
        and(
          eq(branchReportSubmissions.id, id),
          eq(branchReportSubmissions.tenantId, tenantId)
        )
      )
      .returning();

    res.json({
      success: true,
      message: "Branch report updated and resubmitted successfully",
      submission: updated,
    });
  } catch (error: any) {
    console.error("Failed to update submission:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to update submission" });
  }
});

/**
 * 5. DELETE /api/branch-reports/:id
 * Branch Manager deletes their OWN submission, ONLY if status is 'submitted' or 'returned'.
 */
router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const branchId = req.user?.branchId;
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!tenantId || !userId) {
      return res.status(403).json({ success: false, error: "Forbidden: Authentication required" });
    }

    const isHO = isHeadOfficeRole(role);
    const isBM = isBranchManagerRole(role);

    if (!isHO && !isBM) {
      return res.status(403).json({ success: false, error: "Forbidden: Access restricted" });
    }

    const [existing] = await db
      .select()
      .from(branchReportSubmissions)
      .where(
        and(
          eq(branchReportSubmissions.id, id),
          eq(branchReportSubmissions.tenantId, tenantId)
        )
      );

    if (!existing) {
      return res.status(404).json({ success: false, error: "Submission not found" });
    }

    if (!isHO) {
      if (existing.branchId !== branchId || existing.submittedBy !== userId) {
        return res.status(403).json({ success: false, error: "Forbidden: You can only delete your own branch submissions" });
      }
      if (existing.status === "reviewed") {
        return res.status(400).json({ success: false, error: "Locked: Reviewed reports cannot be deleted" });
      }
      if (existing.status !== "submitted" && existing.status !== "returned") {
        return res.status(400).json({ success: false, error: `Cannot delete submission in '${existing.status}' status` });
      }
    }

    await db
      .delete(branchReportSubmissions)
      .where(
        and(
          eq(branchReportSubmissions.id, id),
          eq(branchReportSubmissions.tenantId, tenantId)
        )
      );

    res.json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error: any) {
    console.error("Failed to delete submission:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to delete submission" });
  }
});

export default router;

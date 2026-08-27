import { db } from "@/server/db";
import { branches, tenants } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { logAuditAction } from "@/lib/audit-logger";

export async function createBranchInternal(data: { tenantId: string; name: string; address: string; userId?: string }) {
  return await db.transaction(async (tx) => {
    // Lock the tenant row to prevent concurrent limit bypass
    const [tenantRec] = await tx.select({ outletLimit: tenants.outletLimit })
      .from(tenants).where(eq(tenants.id, data.tenantId)).for('update');
    
    if (!tenantRec) throw new Error("Tenant not found.");

    // The user requested: "Define whether active or all branches count toward the limit."
    // We count ALL non-deleted branches (which matches the original logic activeBranches[0].count).
    const activeBranches = await tx.select({ count: sql<number>`count(*)::int` })
      .from(branches)
      .where(eq(branches.tenantId, data.tenantId));
      
    if (activeBranches[0].count >= tenantRec.outletLimit) {
      throw new Error("Outlet limit reached for this tenant.");
    }

    const [newBranch] = await tx.insert(branches).values({
      tenantId: data.tenantId,
      name: data.name,
      address: data.address,
    }).returning();

    await logAuditAction({
      action: "Create Branch",
      entityType: "branch",
      entityId: newBranch.id,
      tenantId: data.tenantId,
      userId: data.userId,
      summary: `Branch '${data.name}' created`,
      afterValue: { name: data.name }
    }, tx);

    return newBranch;
  });
}

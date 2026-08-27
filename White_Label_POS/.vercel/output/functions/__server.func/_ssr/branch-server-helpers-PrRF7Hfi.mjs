import { a as eq, w as sql } from "../_libs/drizzle-orm+postgres.mjs";
import { i as branches, j as tenants, t as db } from "./db-CvXguwya.mjs";
import { t as logAuditAction } from "./audit-logger-DHg7DkYZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/branch-server-helpers-PrRF7Hfi.js
async function createBranchInternal(data) {
	return await db.transaction(async (tx) => {
		const [tenantRec] = await tx.select({ outletLimit: tenants.outletLimit }).from(tenants).where(eq(tenants.id, data.tenantId)).for("update");
		if (!tenantRec) throw new Error("Tenant not found.");
		if ((await tx.select({ count: sql`count(*)::int` }).from(branches).where(eq(branches.tenantId, data.tenantId)))[0].count >= tenantRec.outletLimit) throw new Error("Outlet limit reached for this tenant.");
		const [newBranch] = await tx.insert(branches).values({
			tenantId: data.tenantId,
			name: data.name,
			address: data.address
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
//#endregion
export { createBranchInternal as t };

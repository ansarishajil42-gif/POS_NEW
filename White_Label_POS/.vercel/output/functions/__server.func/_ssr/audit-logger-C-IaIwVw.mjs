import { r as getSessionServerFn } from "./auth-server-Cm_FskrZ.mjs";
import { n as auditLogs, t as db } from "./db-DPJpDhh1.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/audit-logger-C-IaIwVw.js
async function logAuditAction(params, txContext) {
	try {
		let res = {
			success: false,
			session: null
		};
		try {
			res = await getSessionServerFn();
		} catch (sessionError) {
			console.warn("Session context lost in audit logger:", sessionError);
		}
		const userId = res.success && res.session ? res.session.id : null;
		const actorRole = res.success && res.session ? res.session.role : null;
		const finalTenantId = params.tenantId || (res.success && res.session ? res.session.tenantId : "00000000-0000-0000-0000-000000000000");
		const details = {
			summary: params.summary,
			actorRole,
			beforeValue: params.beforeValue,
			afterValue: params.afterValue,
			requestId: params.requestId,
			ip: params.ip,
			userAgent: params.userAgent
		};
		const record = {
			tenantId: finalTenantId,
			branchId: params.branchId || null,
			userId: userId || null,
			action: params.action,
			entityType: params.entityType,
			entityId: params.entityId,
			details: params.summary ? params.summary : details
		};
		if (txContext) await txContext.insert(auditLogs).values(record);
		else await db.insert(auditLogs).values(record);
	} catch (err) {
		console.error("Audit log failed to write:", err);
		throw new Error("Audit log insertion failed: " + err?.message);
	}
}
//#endregion
export { logAuditAction as t };

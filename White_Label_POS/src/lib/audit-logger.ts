import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { getSessionServerFn } from "@/lib/auth-server";

type AuditAction = {
  action: string;
  entityType: string;
  entityId: string;
  tenantId?: string;
  branchId?: string;
  summary?: string;
  beforeValue?: any;
  afterValue?: any;
  requestId?: string;
  ip?: string;
  userAgent?: string;
};

export async function logAuditAction(params: AuditAction, txContext?: any) {
  try {
    let res: any = { success: false, session: null };
    try {
      res = await getSessionServerFn();
    } catch (sessionError) {
      // AsyncLocalStorage context may be lost inside db transactions
      console.warn("Session context lost in audit logger:", sessionError);
    }
    const userId = res.success && res.session ? res.session.id : null;
    const actorRole = res.success && res.session ? res.session.role : null;
    // We need a uuid for tenantId. If none is available, this might fail unless we make it nullable or provide a default for platform-level actions.
    // The schema says tenantId is notNull(). For super admin platform actions, we might have to use a zero UUID.
    const finalTenantId = params.tenantId || (res.success && res.session ? res.session.tenantId : "00000000-0000-0000-0000-000000000000");

    const details = {
      summary: params.summary,
      actorRole,
      beforeValue: params.beforeValue,
      afterValue: params.afterValue,
      requestId: params.requestId,
      ip: params.ip,
      userAgent: params.userAgent,
    };

    const record = {
      tenantId: finalTenantId as string, 
      branchId: params.branchId || null,
      userId: userId || null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.summary ? params.summary : details,
    };

    if (txContext) {
      await txContext.insert(auditLogs).values(record);
    } else {
      await db.insert(auditLogs).values(record);
    }
  } catch (err) {
    console.error("Audit log failed to write:", err);
    throw new Error("Audit log insertion failed: " + (err as any)?.message);
  }
}

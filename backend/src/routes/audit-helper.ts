import { db } from "../db/index.js";
import { auditLogs } from "../db/schema.js";

export async function logAuditAction(
  tenantId: string,
  userId: string | null,
  branchId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  details?: any
) {
  try {
    await db.insert(auditLogs).values({
      tenantId,
      userId,
      branchId,
      action,
      entityType,
      entityId,
      details: details ? details : null,
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

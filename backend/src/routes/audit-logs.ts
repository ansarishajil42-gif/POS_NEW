import { Router } from "express";
import { db } from "../db/index.js";
import { auditLogs, staffUsers } from "../db/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// GET /api/audit-logs - List audit logs with pagination and actor details
router.get("/", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });

  const page = parseInt(String(req.query.page || "1")) || 1;
  const limit = Math.min(parseInt(String(req.query.limit || "50")) || 50, 100);
  const offset = (page - 1) * limit;

  try {
    const results = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        actorName: staffUsers.name,
        actorEmail: staffUsers.email,
      })
      .from(auditLogs)
      .leftJoin(staffUsers, eq(auditLogs.userId, staffUsers.id))
      .where(eq(auditLogs.tenantId, tenantId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(auditLogs.createdAt));

    res.json(results);
  } catch (error) {
    console.error("List audit logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

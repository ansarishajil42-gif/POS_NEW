import { createServerFn } from "@tanstack/react-start";
import { db } from "@/server/db";
import { supportTickets, supportTicketMessages, tenants, staffUsers } from "@/server/db/schema";
import { eq, and, desc, sql, or, ilike } from "drizzle-orm";
import { getSessionServerFn } from "@/lib/auth-server";
import { logAuditAction } from "@/lib/audit-logger";

export interface SupportTicketItem {
  id: string;
  ticketNumber: string;
  tenantId: string;
  tenantName?: string;
  tenantSubdomain?: string;
  submittedBy: string;
  submitterName?: string;
  submitterEmail?: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  messageCount?: number;
  lastMessageAt?: string | Date;
  lastMessagePreview?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  closedAt?: string | Date | null;
  closedByName?: string | null;
}

export interface SupportTicketMessageItem {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: string;
  senderName: string;
  message: string;
  isInternalNote: boolean;
  createdAt: string | Date;
}

/**
 * Generate a unique human-readable ticket number (e.g. TK-839201)
 */
async function generateUniqueTicketNumber(): Promise<string> {
  let ticketNumber = "";
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 10) {
    attempts++;
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    ticketNumber = `TK-${randomDigits}`;
    const existing = await db.query.supportTickets.findFirst({
      where: eq(supportTickets.ticketNumber, ticketNumber),
      columns: { id: true },
    });
    if (!existing) {
      exists = false;
    }
  }
  return ticketNumber;
}

/**
 * 1. createSupportTicketServerFn
 * Head Office Admin only.
 * Derives tenantId and submittedBy strictly from authenticated session.
 */
export const createSupportTicketServerFn = createServerFn({ method: "POST" })
  .validator((data: { title: string; category?: string; priority?: string; description: string }) => data)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (!sessionRes.success || !sessionRes.session) {
      throw new Error("Unauthorized: Please log in.");
    }

    const { role, tenantId, id: userId, email } = sessionRes.session;
    if (role !== "Head Office Admin" && role !== "head_office_admin") {
      throw new Error("Forbidden: Only Head Office Admins can raise support tickets.");
    }

    if (!tenantId) {
      throw new Error("Forbidden: No tenant associated with this session.");
    }

    const title = (data.title || "").trim();
    const description = (data.description || "").trim();
    const category = (data.category || "General").trim();
    const priority = (data.priority || "Medium").trim();

    if (!title) throw new Error("Title is required.");
    if (!description) throw new Error("Description is required.");

    // Fetch user name for initial message
    const submitter = await db.query.staffUsers.findFirst({
      where: eq(staffUsers.id, userId),
      columns: { name: true, email: true },
    });
    const senderName = submitter?.name || email || "Head Office Admin";

    const ticketNumber = await generateUniqueTicketNumber();

    const [newTicket] = await db
      .insert(supportTickets)
      .values({
        ticketNumber,
        tenantId,
        submittedBy: userId,
        title,
        category,
        priority,
        status: "Open",
        description,
      })
      .returning();

    // Insert initial message into thread
    await db.insert(supportTicketMessages).values({
      ticketId: newTicket.id,
      senderId: userId,
      senderRole: "Head Office Admin",
      senderName,
      message: description,
      isInternalNote: false,
    });

    try {
      await logAuditAction({
        action: "Create Support Ticket",
        entityType: "support_tickets",
        entityId: newTicket.id,
        tenantId,
        summary: `Support ticket ${ticketNumber} opened: ${title}`,
      });
    } catch {
      // Ignore non-critical audit log errors
    }

    return { success: true, ticket: newTicket };
  });

/**
 * 2. getMyTenantTicketsServerFn
 * Session-scoped strictly to caller's own tenantId.
 */
export const getMyTenantTicketsServerFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const sessionRes = await getSessionServerFn();
    if (!sessionRes.success || !sessionRes.session) {
      throw new Error("Unauthorized: Please log in.");
    }

    const { tenantId, role } = sessionRes.session;
    if (role !== "Head Office Admin" && role !== "head_office_admin") {
      throw new Error("Forbidden: Only Head Office Admins can access tenant tickets.");
    }

    if (!tenantId) {
      throw new Error("Forbidden: No tenant associated with this session.");
    }

    const rows = await db
      .select({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
        tenantId: supportTickets.tenantId,
        submittedBy: supportTickets.submittedBy,
        title: supportTickets.title,
        category: supportTickets.category,
        priority: supportTickets.priority,
        status: supportTickets.status,
        description: supportTickets.description,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        closedAt: supportTickets.closedAt,
        closedBy: supportTickets.closedBy,
        submitterName: staffUsers.name,
        submitterEmail: staffUsers.email,
        messageCount: sql<number>`count(distinct ${supportTicketMessages.id})::int`,
      })
      .from(supportTickets)
      .leftJoin(staffUsers, eq(supportTickets.submittedBy, staffUsers.id))
      .leftJoin(supportTicketMessages, and(
        eq(supportTickets.id, supportTicketMessages.ticketId),
        eq(supportTicketMessages.isInternalNote, false)
      ))
      .where(eq(supportTickets.tenantId, tenantId))
      .groupBy(
        supportTickets.id,
        staffUsers.name,
        staffUsers.email
      )
      .orderBy(desc(supportTickets.updatedAt));

    return {
      success: true,
      tickets: rows as SupportTicketItem[],
    };
  });

/**
 * 3. getTicketDetailsServerFn(ticketId)
 * Validates caller is Super Admin OR belongs to ticket's tenantId.
 * Non-Super-Admin callers NEVER see isInternalNote messages.
 */
export const getTicketDetailsServerFn = createServerFn({ method: "GET" })
  .validator((data: { ticketId: string }) => data)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (!sessionRes.success || !sessionRes.session) {
      throw new Error("Unauthorized: Please log in.");
    }

    const { role, tenantId: sessionTenantId } = sessionRes.session;
    const isSuperAdmin = role === "Super Admin" || role === "super_admin";

    const ticket = await db.query.supportTickets.findFirst({
      where: eq(supportTickets.id, data.ticketId),
      with: {
        tenant: {
          columns: { id: true, name: true, subdomain: true, plan: true },
        },
        submitter: {
          columns: { id: true, name: true, email: true, phone: true },
        },
        closer: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    if (!ticket) {
      throw new Error("Support ticket not found.");
    }

    // Tenant check: if not Super Admin, ticket must belong to caller's tenant
    if (!isSuperAdmin) {
      if (!sessionTenantId || ticket.tenantId !== sessionTenantId) {
        throw new Error("Forbidden: You do not have permission to view this ticket.");
      }
    }

    // Fetch message history
    const allMessages = await db
      .select()
      .from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticket.id))
      .orderBy(supportTicketMessages.createdAt);

    // Filter out internal notes for non-Super-Admin users
    const filteredMessages = allMessages.filter((m) => {
      if (isSuperAdmin) return true;
      return !m.isInternalNote;
    });

    return {
      success: true,
      ticket,
      messages: filteredMessages as SupportTicketMessageItem[],
    };
  });

/**
 * 4. replyToTicketServerFn({ ticketId, message, isInternalNote? })
 * Validates caller is Super Admin OR belongs to ticket's tenantId.
 * isInternalNote only honored for Super Admin.
 * Automatically updates updatedAt and shifts status appropriately.
 */
export const replyToTicketServerFn = createServerFn({ method: "POST" })
  .validator((data: { ticketId: string; message: string; isInternalNote?: boolean }) => data)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (!sessionRes.success || !sessionRes.session) {
      throw new Error("Unauthorized: Please log in.");
    }

    const { role, tenantId: sessionTenantId, id: userId, email } = sessionRes.session;
    const isSuperAdmin = role === "Super Admin" || role === "super_admin";
    const textMsg = (data.message || "").trim();

    if (!textMsg) {
      throw new Error("Reply message cannot be empty.");
    }

    const ticket = await db.query.supportTickets.findFirst({
      where: eq(supportTickets.id, data.ticketId),
    });

    if (!ticket) {
      throw new Error("Support ticket not found.");
    }

    if (!isSuperAdmin) {
      if (!sessionTenantId || ticket.tenantId !== sessionTenantId) {
        throw new Error("Forbidden: You do not have permission to reply to this ticket.");
      }
    }

    const staffUser = await db.query.staffUsers.findFirst({
      where: eq(staffUsers.id, userId),
      columns: { name: true, email: true },
    });
    const senderName = staffUser?.name || email || (isSuperAdmin ? "Super Admin Support" : "Head Office Admin");
    const senderRole = isSuperAdmin ? "Super Admin" : "Head Office Admin";
    const internalNote = isSuperAdmin ? Boolean(data.isInternalNote) : false;

    const [newMsg] = await db
      .insert(supportTicketMessages)
      .values({
        ticketId: ticket.id,
        senderId: userId,
        senderRole,
        senderName,
        message: textMsg,
        isInternalNote: internalNote,
      })
      .returning();

    // Determine status shift
    let nextStatus = ticket.status;
    if (!internalNote) {
      if (isSuperAdmin) {
        // When Super Admin replies officially, ticket is waiting on customer feedback
        nextStatus = "Waiting on Customer";
      } else {
        // When Tenant replies, ticket is In Progress
        if (ticket.status === "Waiting on Customer" || ticket.status === "Open" || ticket.status === "Resolved") {
          nextStatus = "In Progress";
        }
      }
    }

    await db
      .update(supportTickets)
      .set({
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticket.id));

    return { success: true, message: newMsg, status: nextStatus };
  });

/**
 * 5. updateTicketStatusServerFn({ ticketId, status, priority? })
 * Super Admin only.
 */
export const updateTicketStatusServerFn = createServerFn({ method: "POST" })
  .validator((data: { ticketId: string; status: string; priority?: string }) => data)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (!sessionRes.success || !sessionRes.session) {
      throw new Error("Unauthorized: Please log in.");
    }

    const { role, id: userId } = sessionRes.session;
    const isSuperAdmin = role === "Super Admin" || role === "super_admin";

    if (!isSuperAdmin) {
      throw new Error("Forbidden: Only Super Admins can update ticket status or priority.");
    }

    const ticket = await db.query.supportTickets.findFirst({
      where: eq(supportTickets.id, data.ticketId),
    });

    if (!ticket) {
      throw new Error("Support ticket not found.");
    }

    const isClosing = data.status === "Resolved" || data.status === "Closed";
    const updatePayload: any = {
      status: data.status,
      updatedAt: new Date(),
      closedAt: isClosing ? new Date() : null,
      closedBy: isClosing ? userId : null,
    };

    if (data.priority) {
      updatePayload.priority = data.priority;
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set(updatePayload)
      .where(eq(supportTickets.id, ticket.id))
      .returning();

    return { success: true, ticket: updatedTicket };
  });

/**
 * 6. getAllTicketsForSuperAdminServerFn
 * Super Admin only.
 * Returns tickets across all tenants with filter options and KPI summary.
 */
export const getAllTicketsForSuperAdminServerFn = createServerFn({ method: "GET" })
  .validator((filters?: { tenantId?: string; status?: string; priority?: string; search?: string }) => filters)
  .handler(async ({ data: filters }) => {
    const sessionRes = await getSessionServerFn();
    if (!sessionRes.success || !sessionRes.session) {
      throw new Error("Unauthorized: Please log in.");
    }

    const { role } = sessionRes.session;
    if (role !== "Super Admin" && role !== "super_admin") {
      throw new Error("Forbidden: Only Super Admins can access platform-wide tickets.");
    }

    const conditions: any[] = [];

    if (filters?.tenantId && filters.tenantId !== "all") {
      conditions.push(eq(supportTickets.tenantId, filters.tenantId));
    }
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(supportTickets.status, filters.status));
    }
    if (filters?.priority && filters.priority !== "all") {
      conditions.push(eq(supportTickets.priority, filters.priority));
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(supportTickets.ticketNumber, q),
          ilike(supportTickets.title, q),
          ilike(supportTickets.description, q),
          ilike(tenants.name, q),
          ilike(staffUsers.name, q),
          ilike(staffUsers.email, q)
        )
      );
    }

    const rows = await db
      .select({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
        tenantId: supportTickets.tenantId,
        tenantName: tenants.name,
        tenantSubdomain: tenants.subdomain,
        submittedBy: supportTickets.submittedBy,
        submitterName: staffUsers.name,
        submitterEmail: staffUsers.email,
        title: supportTickets.title,
        category: supportTickets.category,
        priority: supportTickets.priority,
        status: supportTickets.status,
        description: supportTickets.description,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        closedAt: supportTickets.closedAt,
        closedBy: supportTickets.closedBy,
        messageCount: sql<number>`count(distinct ${supportTicketMessages.id})::int`,
      })
      .from(supportTickets)
      .leftJoin(tenants, eq(supportTickets.tenantId, tenants.id))
      .leftJoin(staffUsers, eq(supportTickets.submittedBy, staffUsers.id))
      .leftJoin(supportTicketMessages, eq(supportTickets.id, supportTicketMessages.ticketId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(
        supportTickets.id,
        tenants.name,
        tenants.subdomain,
        staffUsers.name,
        staffUsers.email
      )
      .orderBy(desc(supportTickets.updatedAt));

    // Platform-wide counts
    const countRows = await db
      .select({
        status: supportTickets.status,
        count: sql<number>`count(*)::int`,
      })
      .from(supportTickets)
      .groupBy(supportTickets.status);

    const metrics = {
      total: 0,
      open: 0,
      inProgress: 0,
      waitingOnCustomer: 0,
      resolved: 0,
      closed: 0,
    };

    countRows.forEach((r) => {
      const c = Number(r.count || 0);
      metrics.total += c;
      if (r.status === "Open") metrics.open += c;
      else if (r.status === "In Progress") metrics.inProgress += c;
      else if (r.status === "Waiting on Customer") metrics.waitingOnCustomer += c;
      else if (r.status === "Resolved") metrics.resolved += c;
      else if (r.status === "Closed") metrics.closed += c;
    });

    return {
      success: true,
      tickets: rows as SupportTicketItem[],
      metrics,
    };
  });

/**
 * 7. updateMySupportTicketServerFn
 * Head Office Admin only.
 * Verifies caller's tenantId AND submittedBy match caller's session.
 * STRICT RECORD LOCK: ONLY allowed if status is NOT "Resolved" or "Closed".
 */
export const updateMySupportTicketServerFn = createServerFn({ method: "POST" })
  .validator((data: { ticketId: string; title?: string; category?: string; priority?: string; description?: string }) => data)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (!sessionRes.success || !sessionRes.session) {
      throw new Error("Unauthorized: Please log in.");
    }

    const { role, tenantId: sessionTenantId, id: userId } = sessionRes.session;
    if (role !== "Head Office Admin" && role !== "head_office_admin") {
      throw new Error("Forbidden: Only Head Office Admins can edit support tickets.");
    }

    if (!sessionTenantId) {
      throw new Error("Forbidden: No tenant associated with this session.");
    }

    const ticket = await db.query.supportTickets.findFirst({
      where: eq(supportTickets.id, data.ticketId),
    });

    if (!ticket) {
      throw new Error("Support ticket not found.");
    }

    // Ownership check: must match tenantId AND submittedBy
    if (ticket.tenantId !== sessionTenantId || ticket.submittedBy !== userId) {
      throw new Error("Forbidden: You can only edit your own submitted support tickets.");
    }

    // Status lock check: reject if Resolved or Closed
    if (ticket.status === "Resolved" || ticket.status === "Closed") {
      throw new Error("Locked: Cannot edit a resolved or closed support ticket.");
    }

    const updates: any = {
      updatedAt: new Date(),
    };
    if (data.title && data.title.trim()) updates.title = data.title.trim();
    if (data.category && data.category.trim()) updates.category = data.category.trim();
    if (data.priority && data.priority.trim()) updates.priority = data.priority.trim();
    if (data.description && data.description.trim()) updates.description = data.description.trim();

    const [updatedTicket] = await db
      .update(supportTickets)
      .set(updates)
      .where(eq(supportTickets.id, ticket.id))
      .returning();

    return { success: true, ticket: updatedTicket };
  });

/**
 * 8. deleteMySupportTicketServerFn
 * Head Office Admin only.
 * Verifies caller's tenantId AND submittedBy match caller's session.
 * STRICT RECORD LOCK: ONLY allowed if status is NOT "Resolved" or "Closed".
 * Deletes the ticket (cascade deletes messages).
 */
export const deleteMySupportTicketServerFn = createServerFn({ method: "POST" })
  .validator((data: { ticketId: string }) => data)
  .handler(async ({ data }) => {
    const sessionRes = await getSessionServerFn();
    if (!sessionRes.success || !sessionRes.session) {
      throw new Error("Unauthorized: Please log in.");
    }

    const { role, tenantId: sessionTenantId, id: userId } = sessionRes.session;
    if (role !== "Head Office Admin" && role !== "head_office_admin") {
      throw new Error("Forbidden: Only Head Office Admins can delete support tickets.");
    }

    if (!sessionTenantId) {
      throw new Error("Forbidden: No tenant associated with this session.");
    }

    const ticket = await db.query.supportTickets.findFirst({
      where: eq(supportTickets.id, data.ticketId),
    });

    if (!ticket) {
      throw new Error("Support ticket not found.");
    }

    // Ownership check: must match tenantId AND submittedBy
    if (ticket.tenantId !== sessionTenantId || ticket.submittedBy !== userId) {
      throw new Error("Forbidden: You can only delete your own submitted support tickets.");
    }

    // Status lock check: reject if Resolved or Closed
    if (ticket.status === "Resolved" || ticket.status === "Closed") {
      throw new Error("Locked: Cannot delete a resolved or closed support ticket.");
    }

    await db.delete(supportTickets).where(eq(supportTickets.id, ticket.id));

    try {
      await logAuditAction({
        action: "Delete Support Ticket",
        entityType: "support_tickets",
        entityId: ticket.id,
        tenantId: sessionTenantId,
        summary: `Support ticket ${ticket.ticketNumber} deleted by submitter`,
      });
    } catch {
      // Ignore non-critical audit log errors
    }

    return { success: true, message: "Ticket deleted successfully." };
  });

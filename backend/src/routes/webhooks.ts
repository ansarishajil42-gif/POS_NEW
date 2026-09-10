import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { eq, or, sql } from "drizzle-orm";
import {
  tenants,
  tenantInvoices,
  tenantSubscriptions,
  tenantPayments,
} from "../db/schema.js";

const router = Router();

/**
 * Webhook receiver for Mamo Pay events.
 * Endpoint: POST /api/webhooks/mamo-pay
 */
router.post("/mamo-pay", async (req: Request, res: Response) => {
  const configuredSecret = process.env.MAMO_PAY_WEBHOOK_SECRET?.trim();
  const authHeader = req.headers["authorization"]?.trim();

  // Validate webhook authorization header
  if (!configuredSecret) {
    console.warn(
      "[Mamo Pay Webhook] MAMO_PAY_WEBHOOK_SECRET is not configured on server. Rejecting webhook request."
    );
    return res.status(401).json({ error: "Webhook secret not configured" });
  }

  const isAuthorized =
    authHeader === configuredSecret ||
    authHeader === `Bearer ${configuredSecret}` ||
    authHeader === `bearer ${configuredSecret}`;

  if (!isAuthorized) {
    console.warn("[Mamo Pay Webhook] Unauthorized webhook attempt with header:", authHeader);
    return res.status(401).json({ error: "Unauthorized webhook payload" });
  }

  const payload = req.body;
  const event = payload?.event || "";
  const data = payload?.data || {};
  const customData = data?.custom_data || data?.customData || {};

  console.log(`[Mamo Pay Webhook] Received event '${event}' for transaction ID: ${data?.id || "N/A"}`);

  try {
    if (
      event === "payment.succeeded" ||
      event === "payment.captured" ||
      event === "charge.succeeded"
    ) {
      const invoiceRef =
        customData?.invoiceId ||
        customData?.invoice_id ||
        data?.external_id ||
        data?.externalId;

      const tenantIdFromData =
        customData?.tenantId ||
        customData?.tenant_id ||
        null;

      if (!invoiceRef) {
        console.warn(
          "[Mamo Pay Webhook] payment.succeeded event missing invoice reference in custom_data / external_id:",
          data
        );
        return res.status(200).json({ received: true, note: "No invoice reference found" });
      }

      // Look up invoice by UUID id or invoice_number
      const matchingInvoices = await db
        .select()
        .from(tenantInvoices)
        .where(
          or(
            eq(tenantInvoices.id, invoiceRef),
            eq(tenantInvoices.invoiceNumber, invoiceRef)
          )
        );

      const invoice = matchingInvoices[0];

      if (!invoice) {
        console.warn(`[Mamo Pay Webhook] Invoice '${invoiceRef}' not found in database.`);
        return res.status(200).json({ received: true, note: "Invoice not found in system" });
      }

      // Idempotency: only process if not already marked paid
      if (invoice.paymentStatus === "paid" || invoice.paymentStatus === "manual_paid") {
        console.log(`[Mamo Pay Webhook] Invoice '${invoice.invoiceNumber}' is already settled. Skipping update.`);
        return res.status(200).json({ received: true, note: "Already processed" });
      }

      const paymentAmount = data?.amount ? String(Number(data.amount).toFixed(2)) : invoice.totalAmount;
      const currency = data?.amount_currency || data?.currency || invoice.currency || "AED";
      const mamoTxId = data?.id || data?.transactionId || `mamo_${Date.now()}`;

      // Update invoice status
      await db
        .update(tenantInvoices)
        .set({
          paymentStatus: "paid",
          paymentMethod: "mamo_pay",
          mamoPaymentLinkId: data?.payment_link_id || data?.id || invoice.mamoPaymentLinkId,
        })
        .where(eq(tenantInvoices.id, invoice.id));

      // Record tenant payment history
      await db.insert(tenantPayments).values({
        tenantId: invoice.tenantId,
        amount: paymentAmount,
        currency,
        paymentDate: data?.paid_at ? new Date(data.paid_at) : new Date(),
        periodCoveredStart: invoice.periodStart,
        periodCoveredEnd: invoice.periodEnd,
        notes: `Online settlement via Mamo Pay (Tx: ${mamoTxId})`,
        recordedBy: "Mamo Pay Webhook Automated",
      });

      // Update / extend tenant subscription active period
      const currentSubs = await db
        .select()
        .from(tenantSubscriptions)
        .where(eq(tenantSubscriptions.tenantId, invoice.tenantId));

      if (currentSubs.length > 0) {
        const sub = currentSubs[0];
        const newEndDate =
          new Date(invoice.periodEnd) > new Date(sub.currentPeriodEndDate)
            ? invoice.periodEnd
            : sub.currentPeriodEndDate;

        await db
          .update(tenantSubscriptions)
          .set({
            currentPeriodEndDate: newEndDate,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(tenantSubscriptions.tenantId, invoice.tenantId));
      } else {
        await db.insert(tenantSubscriptions).values({
          tenantId: invoice.tenantId,
          billingCycle: invoice.billingCycle,
          subscriptionStartDate: invoice.periodStart,
          currentPeriodEndDate: invoice.periodEnd,
          status: "active",
        });
      }

      // Ensure tenant status is Active
      await db
        .update(tenants)
        .set({ status: "Active" })
        .where(eq(tenants.id, invoice.tenantId));

      console.log(
        `[Mamo Pay Webhook] Successfully processed settlement for Invoice ${invoice.invoiceNumber} (Tenant ID: ${invoice.tenantId}).`
      );
    } else if (event === "payment.failed" || event === "charge.failed") {
      console.warn("[Mamo Pay Webhook] Payment failed event received:", {
        transactionId: data?.id,
        reason: data?.failure_reason || data?.status,
        customData,
      });
    } else {
      console.log(`[Mamo Pay Webhook] Unhandled or informational event '${event}'.`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("[Mamo Pay Webhook] Error while processing webhook event:", error);
    // Always return 200 to prevent endless retry loops on application-level error
    return res.status(200).json({ received: true, error: error?.message });
  }
});

export default router;

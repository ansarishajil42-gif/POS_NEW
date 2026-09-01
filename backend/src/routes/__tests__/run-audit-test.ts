import { logAuditAction } from "../audit-helper.js";
import { db } from "../../db/index.js";
import { auditLogs, tenants } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runAuditTests() {
  console.log("\n🧪 Running Complete Audit Log Coverage Test Suite...\n");

  const existingTenant = await db.query.tenants.findFirst();
  let testTenantId = existingTenant?.id;

  if (!testTenantId) {
    const [newTenant] = await db
      .insert(tenants)
      .values({ name: "Audit Test Tenant", subdomain: "audit-test-subdomain" })
      .returning();
    testTenantId = newTenant.id;
  }

  const testUserId = null;
  const testBranchId = null;

  // Test Category 1: Price Overrides
  console.log("--- 1. Testing Category 1: Price Override Audit Logging ---");
  await logAuditAction(
    testTenantId,
    testUserId,
    testBranchId,
    "Price Override Request Submitted",
    "Product",
    "prod-101",
    { standardPrice: "10.00", requestedPrice: "8.50", reason: "Competitor Price Match" }
  );

  const [log1] = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, testTenantId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(1);

  assert(log1?.action === "Price Override Request Submitted", "Price override submission logs to audit_logs");
  assert(log1?.entityType === "Product" && log1?.entityId === "prod-101", "Correct entityType and entityId logged for price override");
  assert((log1?.details as any)?.requestedPrice === "8.50", "Requested price details stored in audit log");

  // Test Category 2: Voided Receipts
  console.log("\n--- 2. Testing Category 2: Voided Receipts Audit Logging ---");
  await logAuditAction(
    testTenantId,
    testUserId,
    testBranchId,
    "Void Receipt",
    "Order",
    "order-void-202",
    { originalTotal: "45.00", itemCount: 3, reason: "Customer Cancelled at Register" }
  );

  const [log2] = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, testTenantId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(1);

  assert(log2?.action === "Void Receipt", "Void receipt logs to audit_logs");
  assert(log2?.entityType === "Order" && log2?.entityId === "order-void-202", "Correct order entityId logged for void receipt");
  assert((log2?.details as any)?.reason === "Customer Cancelled at Register", "Void reason captured in audit log details");

  // Test Category 3: Refunds
  console.log("\n--- 3. Testing Category 3: Refunds Audit Logging ---");
  await logAuditAction(
    testTenantId,
    testUserId,
    testBranchId,
    "Order Refunded",
    "Order",
    "order-refund-303",
    { refundAmount: "29.50", originalTotal: "29.50", reason: "Damaged Packaging Return" }
  );

  const [log3] = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, testTenantId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(1);

  assert(log3?.action === "Order Refunded", "Order refund logs to audit_logs");
  assert((log3?.details as any)?.refundAmount === "29.50", "Refund amount captured in audit log details");

  // Test Category 4: Manual Stock Adjustments
  console.log("\n--- 4. Testing Category 4: Manual Stock Adjustments Audit Logging ---");
  await logAuditAction(
    testTenantId,
    testUserId,
    testBranchId,
    "Manual Stock Adjustment",
    "Product",
    "prod-stock-404",
    { previousQuantity: 50, quantityChange: -5, newQuantity: 45, reason: "Spoilage Correction" }
  );

  const [log4] = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, testTenantId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(1);

  assert(log4?.action === "Manual Stock Adjustment", "Manual stock adjustment logs to audit_logs");
  assert((log4?.details as any)?.previousQuantity === 50 && (log4?.details as any)?.newQuantity === 45, "Stock count changes captured in audit log");

  console.log("\n🎉 ALL 4 AUDIT LOG COVERAGE CATEGORIES VERIFIED SUCCESSFULLY!\n");
}

runAuditTests().catch((e) => {
  console.error(e);
  process.exit(1);
});

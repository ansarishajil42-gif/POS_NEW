import { db } from "../src/db/index.js";
import { tenantPayments, tenantSubscriptions, tenants } from "../src/db/schema.js";
import { eq, like, or } from "drizzle-orm";

async function cleanup() {
    console.log("=== CLEANING UP TEST DATA FROM DATABASE ===");

    // 1. Find the test payment for Paramount Baqala or by "Super Admin Test Runner"
    const testPayments = await db.select().from(tenantPayments).where(
        or(
            eq(tenantPayments.notes, "Automated test payment ref #9988"),
            eq(tenantPayments.recordedBy, "Super Admin Test Runner")
        )
    );

    console.log(`Found ${testPayments.length} test payment record(s) to remove:`);
    testPayments.forEach(p => console.log(` - Payment ID: ${p.id}, TenantID: ${p.tenantId}, Amount: ${p.amount}, Notes: ${p.notes}`));

    for (const p of testPayments) {
        // Delete the test payment
        await db.delete(tenantPayments).where(eq(tenantPayments.id, p.id));
        console.log(`Deleted payment ID: ${p.id}`);

        // Check remaining payments for this tenant
        const remainingPayments = await db.select().from(tenantPayments).where(eq(tenantPayments.tenantId, p.tenantId));
        
        if (remainingPayments.length === 0) {
            // Delete the subscription record if it was generated purely from the test script
            await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, p.tenantId));
            console.log(`Reset/Removed tenant_subscriptions record for tenant ID: ${p.tenantId}`);
        } else {
            // Re-calculate based on latest real payment
            const latest = remainingPayments[0]; // ordered by date
            await db.update(tenantSubscriptions).set({
                currentPeriodEndDate: latest.periodCoveredEnd,
                status: "active"
            }).where(eq(tenantSubscriptions.tenantId, p.tenantId));
            console.log(`Re-calculated tenant_subscriptions for tenant ID: ${p.tenantId} to end date ${latest.periodCoveredEnd}`);
        }
    }

    // 2. Check if any test tenant was created (e.g. Test Grocers LLC)
    const testTenants = await db.select().from(tenants).where(like(tenants.name, "%Test Grocers%"));
    for (const t of testTenants) {
        await db.delete(tenants).where(eq(tenants.id, t.id));
        console.log(`Deleted test tenant: ${t.name} (ID: ${t.id})`);
    }

    console.log("\n=== REMAINING PAYMENTS IN DATABASE ===");
    const remainingPaymentsAll = await db.select().from(tenantPayments);
    const allTenants = await db.select().from(tenants);

    remainingPaymentsAll.forEach(p => {
        const t = allTenants.find(tenant => tenant.id === p.tenantId);
        console.log(` - Payment ID: ${p.id}, Tenant: "${t ? t.name : p.tenantId}", Amount: AED ${p.amount}, Notes: "${p.notes}", RecordedBy: ${p.recordedBy}`);
    });

    console.log("\n=== REMAINING SUBSCRIPTIONS IN DATABASE ===");
    const remainingSubsAll = await db.select().from(tenantSubscriptions);
    remainingSubsAll.forEach(s => {
        const t = allTenants.find(tenant => tenant.id === s.tenantId);
        console.log(` - Sub ID: ${s.id}, Tenant: "${t ? t.name : s.tenantId}", Status: ${s.status}, EndDate: ${s.currentPeriodEndDate}`);
    });

    console.log("\n=== CLEANUP COMPLETED SUCCESSFULLY ===");
    process.exit(0);
}

cleanup().catch(err => {
    console.error("Cleanup error:", err);
    process.exit(1);
});

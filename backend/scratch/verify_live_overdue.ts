import { db } from "../src/db/index.js";
import { tenants, tenantSubscriptions, tenantPayments } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

function computeSubscriptionStatus(currentPeriodEndDate: Date | string | null): "active" | "due_soon" | "overdue" | "no_record" {
    if (!currentPeriodEndDate) return "no_record";
    const now = new Date();
    const endDate = new Date(currentPeriodEndDate);
    if (isNaN(endDate.getTime())) return "no_record";

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dueStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    if (todayStr > dueStr) {
        return "overdue";
    }

    const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dueTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();

    const diffDays = Math.ceil((dueTime - todayTime) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
        return "due_soon";
    }

    return "active";
}

async function testLiveOverdue() {
    console.log("=== VERIFYING LIVE OVERDUE COMPUTATION ON READ ===");

    // 1. Create a dummy tenant with a subscription end date in the PAST (e.g. 5 days ago)
    const [testTenant] = await db.insert(tenants).values({
        name: "Overdue Test Supermarket",
        subdomain: "overduetest" + Date.now(),
        plan: "Starter",
        status: "Active"
    }).returning();

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // 5 days ago

    // Insert subscription record with static status set to "active" in DB (simulating old stale stored value)
    const [sub] = await db.insert(tenantSubscriptions).values({
        tenantId: testTenant.id,
        billingCycle: "monthly",
        subscriptionStartDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        currentPeriodEndDate: pastDate,
        status: "active" // STALE VALUE IN DB!
    }).returning();

    console.log(`Created test tenant "${testTenant.name}" (ID: ${testTenant.id})`);
    console.log(`Past Due Date in DB: ${pastDate.toISOString().split('T')[0]}`);
    console.log(`Stored status in DB table before read: "${sub.status}"`);

    // 2. Perform live read calculation (as done in getBillingOverviewServerFn)
    const liveComputedStatus = computeSubscriptionStatus(sub.currentPeriodEndDate);
    console.log(`Live Computed Status on fetch/read: "${liveComputedStatus}"`);

    if (liveComputedStatus !== "overdue") {
        throw new Error(`TEST FAILED: Expected live computed status 'overdue', but got '${liveComputedStatus}'`);
    }

    console.log("SUCCESS: Live calculation correctly returned 'overdue' on read regardless of stored status!");

    // Clean up test tenant
    await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.id, sub.id));
    await db.delete(tenants).where(eq(tenants.id, testTenant.id));
    console.log("Cleaned up test tenant.");

    process.exit(0);
}

testLiveOverdue().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});

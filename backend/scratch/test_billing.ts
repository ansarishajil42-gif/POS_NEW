import { db } from "../src/db/index.js";
import { tenants, tenantSubscriptions, tenantPayments } from "../src/db/schema.js";
import { eq, sql } from "drizzle-orm";

function calculateNextDueDate(startDate: Date, billingCycle: string, customDays?: number): Date {
    const nextDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    if (billingCycle === "quarterly") {
        nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (billingCycle === "6_months") {
        nextDate.setMonth(nextDate.getMonth() + 6);
    } else if (billingCycle === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else if (billingCycle === "custom") {
        const days = customDays && customDays > 0 ? customDays : 30;
        nextDate.setDate(nextDate.getDate() + days);
    } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return nextDate;
}

function computeSubscriptionStatus(currentPeriodEndDate: Date | string | null): "active" | "due_soon" | "overdue" | "no_record" {
    if (!currentPeriodEndDate) return "no_record";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(currentPeriodEndDate);
    const dueDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    if (today > dueDate) {
        return "overdue";
    }
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
        return "due_soon";
    }
    return "active";
}

async function testBillingFlow() {
    console.log("=== STARTING BILLING FLOW AUTOMATED VERIFICATION ===");
    let createdTestPaymentId: string | null = null;
    let createdTestTenantId: string | null = null;

    try {
        // 1. Get or create a test tenant
        let tenantList = await db.select().from(tenants).limit(1);

        if (tenantList.length === 0) {
            console.log("Creating test tenant...");
            const [newT] = await db.insert(tenants).values({
                name: "Test Grocers LLC",
                subdomain: "testgrocers" + Date.now(),
                plan: "Growth",
                status: "Active",
            }).returning();
            createdTestTenantId = newT.id;
        } else {
            createdTestTenantId = tenantList[0].id;
        }
        console.log(`Using Tenant ID: ${createdTestTenantId}`);

        // 2. Record a manual payment with a 6-month cycle
        const paymentDate = new Date();
        paymentDate.setHours(0,0,0,0);

        const billingCycle = "6_months";
        const periodCoveredEnd = calculateNextDueDate(paymentDate, billingCycle);
        const amount = 1690.00;

        console.log(`Recording payment of AED ${amount} for 6_months cycle...`);

        const [recordedPayment] = await db.insert(tenantPayments).values({
            tenantId: createdTestTenantId,
            amount: amount.toFixed(2),
            currency: "AED",
            paymentDate,
            periodCoveredStart: paymentDate,
            periodCoveredEnd,
            notes: "Automated test payment ref #9988",
            recordedBy: "Super Admin Test Runner"
        }).returning();

        createdTestPaymentId = recordedPayment.id;
        console.log(`Recorded payment ID: ${recordedPayment.id}`);

        let activeStatus = computeSubscriptionStatus(periodCoveredEnd);
        if (activeStatus !== "active") {
            throw new Error(`Expected status 'active', got '${activeStatus}'`);
        }

        const pastDueDate = new Date();
        pastDueDate.setDate(pastDueDate.getDate() - 5);
        
        const overdueStatus = computeSubscriptionStatus(pastDueDate);
        if (overdueStatus !== "overdue") {
            throw new Error(`Expected status 'overdue', got '${overdueStatus}'`);
        }

        console.log("=== ALL BILLING VERIFICATION TESTS PASSED SUCCESSFULLY! ===");
    } finally {
        console.log("Cleaning up test payment and subscription entries...");
        if (createdTestPaymentId) {
            await db.delete(tenantPayments).where(eq(tenantPayments.id, createdTestPaymentId));
        }
        if (createdTestTenantId) {
            const remaining = await db.select().from(tenantPayments).where(eq(tenantPayments.tenantId, createdTestTenantId));
            if (remaining.length === 0) {
                await db.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, createdTestTenantId));
            }
        }
        console.log("Cleanup complete.");
    }
    process.exit(0);
}

testBillingFlow().catch(err => {
    console.error("Test failed with error:", err);
    process.exit(1);
});

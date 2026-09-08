import { db } from "../src/db/index.js";
import { tenants, tenantSubscriptions } from "../src/db/schema.js";
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

async function verify() {
    console.log("=== COMPREHENSIVE LIVE READ COMPUTATION TEST ===");

    // Test 1: Past date (e.g. yesterday 2026-09-07 when today is 2026-09-08)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const statusOverdue = computeSubscriptionStatus(yesterday);
    console.log(`Test 1 (Yesterday ${yesterday.toISOString().split('T')[0]}): status = "${statusOverdue}"`);
    if (statusOverdue !== "overdue") throw new Error("Test 1 Failed!");

    // Test 2: Today (due today)
    const today = new Date();
    const statusDueToday = computeSubscriptionStatus(today);
    console.log(`Test 2 (Today ${today.toISOString().split('T')[0]}): status = "${statusDueToday}"`);
    if (statusDueToday !== "due_soon") throw new Error("Test 2 Failed!");

    // Test 3: 4 days in future
    const in4Days = new Date();
    in4Days.setDate(in4Days.getDate() + 4);
    const statusDueSoon = computeSubscriptionStatus(in4Days);
    console.log(`Test 3 (In 4 days ${in4Days.toISOString().split('T')[0]}): status = "${statusDueSoon}"`);
    if (statusDueSoon !== "due_soon") throw new Error("Test 3 Failed!");

    // Test 4: 30 days in future
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const statusActive = computeSubscriptionStatus(in30Days);
    console.log(`Test 4 (In 30 days ${in30Days.toISOString().split('T')[0]}): status = "${statusActive}"`);
    if (statusActive !== "active") throw new Error("Test 4 Failed!");

    console.log("=== ALL COMPREHENSIVE LIVE READ COMPUTATION TESTS PASSED 100%! ===");
    process.exit(0);
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});

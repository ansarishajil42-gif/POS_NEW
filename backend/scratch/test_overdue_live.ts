import { db } from "../src/db/index.js";
import { tenants, tenantSubscriptions, tenantPayments } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

function computeSubscriptionStatus(currentPeriodEndDate: Date | string | null): "active" | "due_soon" | "overdue" | "no_record" {
    if (!currentPeriodEndDate) return "no_record";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(currentPeriodEndDate);
    const dueDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    console.log(`[computeSubscriptionStatus Debug] Today: ${today.toISOString()}, DueDate: ${dueDate.toISOString()}`);
    console.log(`[computeSubscriptionStatus Debug] today > dueDate? ${today > dueDate}`);

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

async function run() {
    console.log("Checking all tenant subscriptions in DB...");
    const subs = await db.select().from(tenantSubscriptions);
    const tenantList = await db.select().from(tenants);

    for (const sub of subs) {
        const tenant = tenantList.find(t => t.id === sub.tenantId);
        const liveStatus = computeSubscriptionStatus(sub.currentPeriodEndDate);
        console.log(`Tenant "${tenant?.name}": StoredStatus="${sub.status}", LiveStatus="${liveStatus}", EndDate=${sub.currentPeriodEndDate}`);
    }

    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});

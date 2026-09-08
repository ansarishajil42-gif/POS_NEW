import { db } from "../src/db/index.js";
import { tenantPayments, tenants } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

async function checkPayments() {
    const payments = await db.select().from(tenantPayments);
    const tenantRows = await db.select().from(tenants);

    console.log("=== ALL TENANT PAYMENTS IN DATABASE ===");
    console.log(`Total payment entries count: ${payments.length}`);

    let sum = 0;
    payments.forEach((p, idx) => {
        const tenant = tenantRows.find(t => t.id === p.tenantId);
        const amt = Number(p.amount || 0);
        sum += amt;
        console.log(`Entry #${idx + 1}: ID=${p.id}, Tenant="${tenant ? tenant.name : p.tenantId}", Amount=AED ${amt}, Date=${p.paymentDate}, RecordedBy=${p.recordedBy}, Notes="${p.notes}"`);
    });

    console.log(`\nSUM OF ALL ENTRIES = AED ${sum.toFixed(2)}`);
    process.exit(0);
}

checkPayments().catch(err => {
    console.error(err);
    process.exit(1);
});

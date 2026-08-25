import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";

async function main() {
    console.log("Connecting to database...");
    const sql = postgres(process.env.DATABASE_URL!);
    
    try {
        console.log("Applying schema changes to batches...");
        await sql`ALTER TABLE batches ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE`;
        await sql`ALTER TABLE batches ADD COLUMN IF NOT EXISTS grn_id uuid REFERENCES grn(id) ON DELETE CASCADE`;
        await sql`ALTER TABLE batches ADD COLUMN IF NOT EXISTS manufacturing_date timestamp`;
        
        console.log("Applying schema changes to grn_items...");
        await sql`ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS batch_number text`;
        await sql`ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS manufacturing_date timestamp`;
        await sql`ALTER TABLE grn_items ADD COLUMN IF NOT EXISTS expiry_date timestamp`;

        console.log("Schema updated successfully. Starting data migration...");

        // Find the Test Water product
        const products = await sql`SELECT id, tenant_id FROM products WHERE name = 'Test Water' LIMIT 1`;
        if (products.length === 0) {
            console.log("Test Water product not found.");
            return;
        }
        const productId = products[0].id;
        const tenantId = products[0].tenant_id;

        // Find the original GRN
        const grns = await sql`SELECT id, branch_id FROM grn WHERE grn_number = 'SUP-GRN-20260821-001' AND tenant_id = ${tenantId} LIMIT 1`;
        if (grns.length === 0) {
            console.log("GRN SUP-GRN-20260821-001 not found.");
            return;
        }
        const grnId = grns[0].id;
        const branchId = grns[0].branch_id;

        // Ensure no duplicate batch exists
        const existingBatches = await sql`SELECT id FROM batches WHERE batch_number = 'TW-BATCH-001' AND product_id = ${productId} AND grn_id = ${grnId}`;
        
        if (existingBatches.length > 0) {
            console.log("Backfill batch TW-BATCH-001 already exists. Skipping insertion.");
        } else {
            console.log("Inserting backfill batch for Test Water...");
            // Expiry date in the future (e.g. 1 year from now)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            await sql`
                INSERT INTO batches (id, tenant_id, product_id, branch_id, grn_id, batch_number, expiry_date, stock)
                VALUES (gen_random_uuid(), ${tenantId}, ${productId}, ${branchId}, ${grnId}, 'TW-BATCH-001', ${expiryDate.toISOString()}, 10)
            `;

            console.log(`Backfill successful: Batch TW-BATCH-001 created with expiry ${expiryDate.toISOString()} and stock 10.`);
        }

    } catch (err) {
        console.error("Migration Error:", err);
    } finally {
        await sql.end();
        console.log("Migration finished.");
    }
}

main();

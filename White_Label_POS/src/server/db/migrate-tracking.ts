import { db } from "./index";
import { products, stockLevels, batches } from "./schema";
import { eq, and, sql, sum } from "drizzle-orm";

async function runMigration() {
  console.log("Starting batch tracking migration...");

  console.log("Applying schema alterations...");
  try {
    await db.execute(sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_expiry_tracked boolean DEFAULT true;`);
    await db.execute(sql`ALTER TABLE batches ADD COLUMN IF NOT EXISTS received_qty integer NOT NULL DEFAULT 0;`);
    await db.execute(sql`ALTER TABLE batches ADD COLUMN IF NOT EXISTS unit_cost numeric(10, 2);`);
    await db.execute(sql`ALTER TABLE batches ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES staff_users(id);`);
  } catch(e) {
    console.error("Schema alteration failed, maybe they already exist?", e);
  }

  // 1. Update all products to be batch and expiry tracked
  console.log("Updating all products to enforce batch and expiry tracking...");
  await db.update(products).set({
    isBatchTracked: true,
    isExpiryTracked: true,
  });
  console.log("Products updated successfully.");

  // 2. Resolve stock deficits by creating legacy batches
  console.log("Scanning stock levels to ensure sufficient batch inventory...");
  
  const allStockLevels = await db.query.stockLevels.findMany({
    where: (stockLevels, { gt }) => gt(stockLevels.stock, 0),
    with: {
      product: true,
      branch: true,
    }
  });

  const now = new Date();
  const legacyDateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  
  // Set expiry 10 years in the future
  const farFutureExpiry = new Date();
  farFutureExpiry.setFullYear(now.getFullYear() + 10);

  let legacyBatchCounter = 1;
  let createdCount = 0;

  for (const stock of allStockLevels) {
    // Find all batches for this product and branch
    const existingBatches = await db.query.batches.findMany({
      where: and(
        eq(batches.productId, stock.productId),
        eq(batches.branchId, stock.branchId)
      )
    });

    const sumBatchesStock = existingBatches.reduce((acc, b) => acc + b.stock, 0);
    const deficit = stock.stock - sumBatchesStock;

    if (deficit > 0) {
      const batchNum = `LEGACY-${legacyDateStr}-${legacyBatchCounter.toString().padStart(3, '0')}`;
      legacyBatchCounter++;

      console.log(`Creating legacy batch ${batchNum} for product ${stock.product.name} (Deficit: ${deficit})`);
      
      await db.insert(batches).values({
        tenantId: stock.product.tenantId,
        productId: stock.productId,
        branchId: stock.branchId,
        batchNumber: batchNum,
        manufacturingDate: now,
        expiryDate: farFutureExpiry,
        stock: deficit,
        receivedQty: deficit,
        unitCost: stock.product.costPrice,
        createdBy: null,
      });

      createdCount++;
    }
  }

  console.log(`Migration complete. Created ${createdCount} legacy batches to resolve stock deficits.`);
  process.exit(0);
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

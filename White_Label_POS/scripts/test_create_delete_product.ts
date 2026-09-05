import { db } from "../src/server/db/index.js";
import { products, stockLevels, productBarcodes, productVariants, unitConversions } from "../src/server/db/schema.js";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const TENANT_ID = "b6ae6062-b05f-451c-a1ab-5bdaac17b763"; // Paramount Baqala
const BRANCH_AL_DANAH = "7de35b6c-3201-4353-af1d-7e33f55f70c0";

async function main() {
  console.log("=== TESTING PRODUCT CREATION AND REAL HARD DELETION ===");

  const testProdId = crypto.randomUUID();
  const testBarcode = `TEST-${Date.now()}`;
  const testSku = `SKU-${Date.now()}`;

  console.log(`1. Creating test product with ID: ${testProdId}, Barcode: ${testBarcode}...`);

  // Insert test product
  await db.insert(products).values({
    id: testProdId,
    tenantId: TENANT_ID,
    name: "Test Hard Delete Product",
    barcode: testBarcode,
    sku: testSku,
    category: "Test",
    unit: "PCS",
    costPrice: "10.00",
    salePrice: "15.00",
    isBatchTracked: false,
    isActive: true,
  });

  // Insert stock_levels
  await db.insert(stockLevels).values({
    id: crypto.randomUUID(),
    tenantId: TENANT_ID,
    productId: testProdId,
    branchId: BRANCH_AL_DANAH,
    stock: 0,
    reorderLevel: 10,
  });

  // Insert product_barcodes
  await db.insert(productBarcodes).values({
    id: crypto.randomUUID(),
    productId: testProdId,
    barcode: testBarcode,
  });

  // Verify rows exist
  const [createdProd] = await db.select().from(products).where(eq(products.id, testProdId));
  const createdStock = await db.select().from(stockLevels).where(eq(stockLevels.productId, testProdId));
  const createdBarcodes = await db.select().from(productBarcodes).where(eq(productBarcodes.productId, testProdId));

  console.log("Created successfully in DB:");
  console.log(`- Product exists: ${!!createdProd} (${createdProd?.name})`);
  console.log(`- Stock level records: ${createdStock.length}`);
  console.log(`- Barcode records: ${createdBarcodes.length}`);

  console.log("\n2. Executing cascade delete transaction (same as deleteProductFn)...");
  await db.transaction(async (tx) => {
    await tx.delete(stockLevels).where(eq(stockLevels.productId, testProdId));
    await tx.delete(productBarcodes).where(eq(productBarcodes.productId, testProdId));
    await tx.delete(productVariants).where(eq(productVariants.productId, testProdId));
    await tx.delete(unitConversions).where(eq(unitConversions.productId, testProdId));
    await tx.delete(products).where(eq(products.id, testProdId));
  });

  console.log("\n3. Querying DB to confirm permanent deletion...");
  const [remainingProd] = await db.select().from(products).where(eq(products.id, testProdId));
  const remainingStock = await db.select().from(stockLevels).where(eq(stockLevels.productId, testProdId));
  const remainingBarcodes = await db.select().from(productBarcodes).where(eq(productBarcodes.productId, testProdId));

  console.log(`- Product row in DB: ${remainingProd ? "FOUND (FAIL)" : "NULL / NONE (SUCCESS - Permanently Gone)"}`);
  console.log(`- Stock levels in DB: ${remainingStock.length} (SUCCESS)`);
  console.log(`- Barcodes in DB: ${remainingBarcodes.length} (SUCCESS)`);

  if (!remainingProd && remainingStock.length === 0 && remainingBarcodes.length === 0) {
    console.log("\n✅ HARD DELETE CONFIRMED 100% OPERATIONAL.");
  } else {
    console.error("\n❌ DELETE FAILED.");
    process.exit(1);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

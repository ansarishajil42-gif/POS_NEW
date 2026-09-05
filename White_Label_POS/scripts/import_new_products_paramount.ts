import xlsx from "xlsx";
import path from "path";
import crypto from "crypto";
import { db } from "../src/server/db/index.js";
import { products, stockLevels, productBarcodes } from "../src/server/db/schema.js";
import { sql } from "drizzle-orm";

const TENANT_ID = "b6ae6062-b05f-451c-a1ab-5bdaac17b763"; // Paramount Baqala
const BRANCH_AL_DANAH = "7de35b6c-3201-4353-af1d-7e33f55f70c0";
const BRANCH_AL_KHALDIYAH = "35bb8764-390b-4221-be92-9379b0dbd891";
const BRANCH_AL_NAHYAN = "b8a2cc43-d047-411c-9d15-ce3b4f6d41a5";

async function main() {
  console.log("================================================================================");
  console.log("IMPORT NEW PRODUCTS FOR PARAMOUNT BAQALA (AL DANAH ONLY)");
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log("================================================================================\n");

  // 1. Clean any partial products for this tenant
  console.log("Cleaning any existing products for Paramount Baqala...");
  await db.execute(sql`DELETE FROM stock_levels WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ${TENANT_ID}::uuid);`);
  await db.execute(sql`DELETE FROM product_barcodes WHERE product_id IN (SELECT id FROM products WHERE tenant_id = ${TENANT_ID}::uuid);`);
  await db.execute(sql`DELETE FROM products WHERE tenant_id = ${TENANT_ID}::uuid;`);
  console.log("Products table cleaned for Paramount Baqala.\n");

  // 2. Read Excel file
  const excelFilePath = path.resolve("src/assets/New_Product.xlsx");
  console.log(`Reading Excel file: ${excelFilePath}`);
  const workbook = xlsx.readFile(excelFilePath, { raw: false, cellText: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: "", raw: false });

  console.log(`Total rows read from Excel: ${rows.length}`);

  const productsToInsert: Array<{
    id: string;
    tenantId: string;
    name: string;
    barcode: string;
    sku: null;
    category: string;
    unit: string;
    costPrice: string;
    salePrice: string;
    isBatchTracked: boolean;
  }> = [];

  const stockLevelsToInsert: Array<{
    id: string;
    productId: string;
    branchId: string;
    stock: number;
    reorderLevel: number;
    priceOverride: null;
  }> = [];

  const barcodesToInsert: Array<{
    id: string;
    productId: string;
    barcode: string;
  }> = [];

  let skuFallbackCount = 0;
  let skippedDuplicatesCount = 0;
  const seenBarcodesInBatch = new Set<string>();
  const specialPricesAdjusted: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const name = (r["name"] || "").toString().trim();
    let barcode1 = (r["barcode 1"] || "").toString().trim();
    const skuVal = (r["sku"] || "").toString().trim();
    const isWeighted = (r["isWeighted"] || "").toString().trim().toLowerCase();
    const baseWeightUnit = (r["baseWeightUnit"] || "").toString().trim();
    const category1 = (r["category 1"] || "").toString().trim();
    const priceVal = (r["price"] || "0").toString().trim();

    let usedSkuFallback = false;
    if (!barcode1) {
      if (skuVal) {
        barcode1 = skuVal;
        usedSkuFallback = true;
        skuFallbackCount++;
      } else {
        console.warn(`Row ${i + 2}: Missing both barcode 1 and sku! Skipping.`);
        continue;
      }
    }

    // Check duplicate within file
    if (seenBarcodesInBatch.has(barcode1)) {
      skippedDuplicatesCount++;
      console.warn(`Row ${i + 2}: Duplicate barcode '${barcode1}'. Skipping.`);
      continue;
    }
    seenBarcodesInBatch.add(barcode1);

    // Unit mapping
    let unit = "PCS";
    if (isWeighted === "true" || isWeighted === "1") {
      unit = baseWeightUnit ? baseWeightUnit.toUpperCase() : "KG";
    }

    // Category mapping
    const category = category1 || "Uncategorized";

    // Sale Price (as-is formatted decimal)
    let salePriceNum = parseFloat(priceVal);
    if (isNaN(salePriceNum) || salePriceNum < 0 || salePriceNum >= 10000000) {
      specialPricesAdjusted.push(`Row ${i + 2} (${name}): price was '${priceVal}', adjusted to 0.00`);
      salePriceNum = 0.00;
    }
    const salePriceStr = salePriceNum.toFixed(2);

    const productId = crypto.randomUUID();

    productsToInsert.push({
      id: productId,
      tenantId: TENANT_ID,
      name: name || "Unnamed Product",
      barcode: barcode1,
      sku: null, // Guaranteed NULL
      category,
      unit,
      costPrice: "0.00",
      salePrice: salePriceStr,
      isBatchTracked: false,
    });

    // Stock Level for AL DANAH ONLY
    stockLevelsToInsert.push({
      id: crypto.randomUUID(),
      productId: productId,
      branchId: BRANCH_AL_DANAH,
      stock: 0,
      reorderLevel: 10,
      priceOverride: null,
    });

    // Alternate Barcodes (barcode 2 to 7)
    for (let bIdx = 2; bIdx <= 7; bIdx++) {
      const altBarcode = (r[`barcode ${bIdx}`] || "").toString().trim();
      if (altBarcode) {
        barcodesToInsert.push({
          id: crypto.randomUUID(),
          productId: productId,
          barcode: altBarcode,
        });
      }
    }
  }

  console.log(`\nPrepared for insertion:`);
  console.log(` - Products: ${productsToInsert.length}`);
  console.log(` - Stock Levels (Al Danah only): ${stockLevelsToInsert.length}`);
  console.log(` - Alternate Barcodes: ${barcodesToInsert.length}`);
  console.log(` - SKU Fallback Barcodes used: ${skuFallbackCount}`);
  console.log(` - Skipped duplicates: ${skippedDuplicatesCount}`);
  if (specialPricesAdjusted.length > 0) {
    console.log(` - Prices adjusted due to invalid/corrupted numeric input:`, specialPricesAdjusted);
  }

  // 3. Batch Insert Products in chunks of 1000
  const BATCH_SIZE = 1000;
  console.log(`\nInserting ${productsToInsert.length} products in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
    const chunk = productsToInsert.slice(i, i + BATCH_SIZE);
    await db.insert(products).values(chunk);
    process.stdout.write(` Products inserted: ${Math.min(i + BATCH_SIZE, productsToInsert.length)}/${productsToInsert.length}\r`);
  }
  console.log(`\n Products insertion complete!`);

  // 4. Batch Insert Stock Levels in chunks of 1000
  console.log(`\nInserting ${stockLevelsToInsert.length} stock levels in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < stockLevelsToInsert.length; i += BATCH_SIZE) {
    const chunk = stockLevelsToInsert.slice(i, i + BATCH_SIZE);
    await db.insert(stockLevels).values(chunk);
    process.stdout.write(` Stock levels inserted: ${Math.min(i + BATCH_SIZE, stockLevelsToInsert.length)}/${stockLevelsToInsert.length}\r`);
  }
  console.log(`\n Stock levels insertion complete!`);

  // 5. Batch Insert Alternate Barcodes in chunks of 1000
  if (barcodesToInsert.length > 0) {
    console.log(`\nInserting ${barcodesToInsert.length} alternate barcodes in batches of ${BATCH_SIZE}...`);
    for (let i = 0; i < barcodesToInsert.length; i += BATCH_SIZE) {
      const chunk = barcodesToInsert.slice(i, i + BATCH_SIZE);
      await db.insert(productBarcodes).values(chunk);
      process.stdout.write(` Barcodes inserted: ${Math.min(i + BATCH_SIZE, barcodesToInsert.length)}/${barcodesToInsert.length}\r`);
    }
    console.log(`\n Alternate barcodes insertion complete!`);
  }

  // 6. POST-IMPORT VERIFICATION
  console.log("\n================================================================================");
  console.log("POST-IMPORT VERIFICATION");
  console.log("================================================================================\n");

  const finalProdCountRes: any[] = await db.execute(
    sql`SELECT count(*) as count FROM products WHERE tenant_id = ${TENANT_ID}::uuid;`
  );
  const finalProductCount = Number(finalProdCountRes[0]?.count || 0);
  console.log(`Final Paramount Baqala Product Count in DB: ${finalProductCount}`);

  const finalBarcodeCountRes: any[] = await db.execute(
    sql`
      SELECT count(*) as count 
      FROM product_barcodes pb
      JOIN products p ON pb.product_id = p.id
      WHERE p.tenant_id = ${TENANT_ID}::uuid;
    `
  );
  console.log(`Final Alternate Barcodes in DB: ${finalBarcodeCountRes[0]?.count}`);

  // Check branch breakdown for stock_levels
  const branchStockCheck: any[] = await db.execute(
    sql`
      SELECT b.name as branch_name, b.id as branch_id, count(sl.id) as count
      FROM branches b
      LEFT JOIN stock_levels sl ON b.id = sl.branch_id AND sl.product_id IN (
        SELECT id FROM products WHERE tenant_id = ${TENANT_ID}::uuid
      )
      WHERE b.tenant_id = ${TENANT_ID}::uuid
      GROUP BY b.id, b.name
      ORDER BY b.name ASC;
    `
  );
  console.log("\nStock Levels per Branch for Paramount Baqala:");
  for (const b of branchStockCheck) {
    console.log(` - ${b.branch_name} (${b.branch_id}): ${b.count} stock_levels rows`);
  }

  // Check SKU column is NULL
  const skuCheck: any[] = await db.execute(
    sql`SELECT count(*) as count FROM products WHERE tenant_id = ${TENANT_ID}::uuid AND sku IS NOT NULL;`
  );
  console.log(`\nProducts with non-null SKU in DB: ${skuCheck[0]?.count} (Expected: 0)`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});

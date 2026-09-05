import xlsx from "xlsx";
import path from "path";
import crypto from "crypto";
import { db } from "../src/server/db/index.js";
import { products, stockLevels, productBarcodes } from "../src/server/db/schema.js";
import { eq, count, inArray } from "drizzle-orm";

const TENANT_ID = "b6ae6062-b05f-451c-a1ab-5bdaac17b763"; // Paramount Baqala

const BRANCH_AL_DANAH = "7de35b6c-3201-4353-af1d-7e33f55f70c0";
const BRANCH_AL_KHALDIYAH = "35bb8764-390b-4221-be92-9379b0dbd891";
const BRANCH_AL_NAHYAN = "b8a2cc43-d047-411c-9d15-ce3b4f6d41a5";

async function main() {
  console.log("================================================================================");
  console.log("EXECUTE IMPORT: 6,026 REMAINING STANDALONE PRODUCTS & CLEANUP");
  console.log("================================================================================");

  // 1. Check initial counts
  const [initProdCount] = await db
    .select({ val: count() })
    .from(products)
    .where(eq(products.tenantId, TENANT_ID));
  const initialProductCount = Number(initProdCount?.val || 0);

  const [initBarcodeCount] = await db
    .select({ val: count() })
    .from(productBarcodes)
    .innerJoin(products, eq(productBarcodes.productId, products.id))
    .where(eq(products.tenantId, TENANT_ID));
  const initialBarcodeCount = Number(initBarcodeCount?.val || 0);

  console.log(`Initial Product Count in DB: ${initialProductCount}`);
  console.log(`Initial Barcode rows in DB: ${initialBarcodeCount}`);

  // 2. Fetch all existing products for Paramount Baqala
  const existingProducts = await db
    .select({ id: products.id, barcode: products.barcode, sku: products.sku })
    .from(products)
    .where(eq(products.tenantId, TENANT_ID));

  const existingBarcodeSet = new Set(existingProducts.map((p) => p.barcode).filter(Boolean));
  const existingSkuSet = new Set(existingProducts.map((p) => p.sku).filter(Boolean));

  // 3. Read Excel file
  const excelFilePath = path.resolve("src/assets/product.xlsx");
  const workbook = xlsx.readFile(excelFilePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const dataRows = rawData.slice(1);

  console.log(`Excel Data Rows: ${dataRows.length}`);

  // 4. Identify the rows to insert
  const toInsert: {
    id: string;
    tenantId: string;
    name: string;
    sku: string;
    barcode: string;
    unit: string;
    category: string;
    costPrice: string;
    salePrice: string;
    isBatchTracked: boolean;
    isActive: boolean;
  }[] = [];

  const seenBarcodesInBatch = new Set<string>();

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    const itemCode = row[0] !== undefined && row[0] !== null ? String(row[0]).trim() : "";
    const itemName = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : "";
    const barcode = row[2] !== undefined && row[2] !== null ? String(row[2]).trim() : "";
    const unit = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : "PCS";
    const vatRsp = Number(row[5]) || 0;

    if (!itemCode || !itemName) continue;

    // Check if already a standalone product
    if (existingBarcodeSet.has(barcode) || seenBarcodesInBatch.has(barcode)) {
      continue;
    }

    seenBarcodesInBatch.add(barcode);

    const sku = barcode ? `${itemCode}-${barcode}` : `${itemCode}-${unit}`;
    const vatExclusivePrice = Math.round((vatRsp / 1.05) * 100) / 100;

    toInsert.push({
      id: crypto.randomUUID(),
      tenantId: TENANT_ID,
      name: itemName,
      sku,
      barcode: barcode || sku,
      unit,
      category: "Uncategorized",
      costPrice: "0.00",
      salePrice: vatExclusivePrice.toFixed(2),
      isBatchTracked: false,
      isActive: true,
    });
  }

  console.log(`Identified ${toInsert.length} missing rows to insert as standalone products.`);

  // 5. Chunked insertion of products & stock levels
  const CHUNK_SIZE = 500;
  let insertedCount = 0;
  const branches = [BRANCH_AL_DANAH, BRANCH_AL_KHALDIYAH, BRANCH_AL_NAHYAN];

  for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
    const chunk = toInsert.slice(i, i + CHUNK_SIZE);

    const insertedChunk = await db
      .insert(products)
      .values(chunk)
      .onConflictDoNothing({
        target: [products.tenantId, products.sku],
      })
      .returning({ id: products.id });

    insertedCount += insertedChunk.length;

    // Stock levels for all 3 branches
    const stockRows: any[] = [];
    for (const p of insertedChunk) {
      for (const branchId of branches) {
        stockRows.push({
          id: crypto.randomUUID(),
          tenantId: TENANT_ID,
          productId: p.id,
          branchId,
          stock: 0,
          reorderLevel: 10,
        });
      }
    }

    if (stockRows.length > 0) {
      await db.insert(stockLevels).values(stockRows);
    }

    process.stdout.write(`\rInserted products chunk ${Math.min(i + CHUNK_SIZE, toInsert.length)}/${toInsert.length} (Total created: ${insertedCount})...`);
  }

  console.log(`\nSuccessfully created ${insertedCount} standalone products with stock levels across 3 branches.`);

  // 6. Clean up redundant alternate barcodes from product_barcodes
  console.log("\nCleaning up redundant entries from product_barcodes table...");
  // All barcodes now exist as standalone products, so we delete the alternate barcodes for this tenant
  const barcodesToDelete = await db
    .select({ id: productBarcodes.id })
    .from(productBarcodes)
    .innerJoin(products, eq(productBarcodes.productId, products.id))
    .where(eq(products.tenantId, TENANT_ID));

  console.log(`Found ${barcodesToDelete.length} total entries in product_barcodes to delete.`);

  let deletedBarcodesCount = 0;
  const BARCODE_CHUNK_SIZE = 500;
  for (let i = 0; i < barcodesToDelete.length; i += BARCODE_CHUNK_SIZE) {
    const ids = barcodesToDelete.slice(i, i + BARCODE_CHUNK_SIZE).map((b) => b.id);
    await db.delete(productBarcodes).where(inArray(productBarcodes.id, ids));
    deletedBarcodesCount += ids.length;
    process.stdout.write(`\rDeleted ${deletedBarcodesCount}/${barcodesToDelete.length} redundant barcodes...`);
  }

  console.log(`\nDeleted ${deletedBarcodesCount} redundant product_barcodes entries.`);

  // 7. Verify Final Counts
  const [finalProdCount] = await db
    .select({ val: count() })
    .from(products)
    .where(eq(products.tenantId, TENANT_ID));
  const finalProductCount = Number(finalProdCount?.val || 0);

  const [finalBarcodeCount] = await db
    .select({ val: count() })
    .from(productBarcodes)
    .innerJoin(products, eq(productBarcodes.productId, products.id))
    .where(eq(products.tenantId, TENANT_ID));

  console.log("================================================================================");
  console.log("FINAL RESULTS SUMMARY:");
  console.log(`- Total Initial Products: ${initialProductCount}`);
  console.log(`- Total New Standalone Products Inserted: ${insertedCount}`);
  console.log(`- Total Redundant product_barcodes Rows Deleted: ${deletedBarcodesCount}`);
  console.log(`- Final Product Count (Paramount Baqala): ${finalProductCount}`);
  console.log(`- Final product_barcodes Count (Paramount Baqala): ${Number(finalBarcodeCount?.val || 0)}`);
  console.log("================================================================================");

  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL ERROR:", e);
  process.exit(1);
});

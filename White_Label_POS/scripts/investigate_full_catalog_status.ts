import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { db } from "../src/server/db/index.js";
import { products, productBarcodes } from "../src/server/db/schema.js";
import { eq, sql, count } from "drizzle-orm";

const TENANT_ID = "b6ae6062-b05f-451c-a1ab-5bdaac17b763"; // Paramount Baqala

async function main() {
  console.log("================================================================================");
  console.log("INVESTIGATION: PARAMOUNT BAQALA CATALOG & EXCEL SOURCE ANALYSIS");
  console.log("================================================================================");

  // 1. Current DB Product Count
  const [productCountRes] = await db
    .select({ val: count() })
    .from(products)
    .where(eq(products.tenantId, TENANT_ID));
  const currentDbProductCount = Number(productCountRes?.val || 0);

  // 3. Current product_barcodes table count for Paramount Baqala
  const [barcodesCountRes] = await db
    .select({ val: count() })
    .from(productBarcodes)
    .innerJoin(products, eq(productBarcodes.productId, products.id))
    .where(eq(products.tenantId, TENANT_ID));
  const currentDbBarcodeCount = Number(barcodesCountRes?.val || 0);

  // Fetch all existing SKUs currently in DB for this tenant
  const existingProducts = await db
    .select({ sku: products.sku, id: products.id, barcode: products.barcode })
    .from(products)
    .where(eq(products.tenantId, TENANT_ID));
  const existingSkuSet = new Set(existingProducts.map((p) => p.sku).filter(Boolean));

  // 2. Read Excel file
  const excelFilePath = path.resolve("src/assets/product.xlsx");
  console.log(`Excel File: ${excelFilePath}`);

  const workbook = xlsx.readFile(excelFilePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const totalRawRows = rawData.length;
  const header = rawData[0];
  const dataRows = rawData.slice(1);
  const totalDataRows = dataRows.length;

  let blankItemCodeCount = 0;
  let blankItemNameCount = 0;
  let blankBarcodeCount = 0;

  const barcodeCounts = new Map<string, number>();
  const itemCodeCounts = new Map<string, number>();
  const itemCodePlusBarcodeCounts = new Map<string, number>();

  interface CleanRow {
    rowIdx: number;
    itemCode: string;
    itemName: string;
    barcode: string;
    unit: string;
    brand: string;
    vatRsp: number;
    stockQty: number;
    skuCandidate: string;
  }

  const cleanRows: CleanRow[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) {
      continue;
    }

    const itemCode = row[0] !== undefined && row[0] !== null ? String(row[0]).trim() : "";
    const itemName = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : "";
    const barcode = row[2] !== undefined && row[2] !== null ? String(row[2]).trim() : "";
    const unit = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : "PCS";
    const brand = row[4] !== undefined && row[4] !== null ? String(row[4]).trim() : "";
    const vatRsp = Number(row[5]) || 0;
    const stockQty = Number(row[6]) || 0;

    if (!itemCode) blankItemCodeCount++;
    if (!itemName) blankItemNameCount++;
    if (!barcode) blankBarcodeCount++;

    if (barcode) {
      barcodeCounts.set(barcode, (barcodeCounts.get(barcode) || 0) + 1);
    }
    if (itemCode) {
      itemCodeCounts.set(itemCode, (itemCodeCounts.get(itemCode) || 0) + 1);
    }

    const itemCodePlusBarcode = barcode ? `${itemCode}-${barcode}` : `${itemCode}-${unit}`;
    itemCodePlusBarcodeCounts.set(itemCodePlusBarcode, (itemCodePlusBarcodeCounts.get(itemCodePlusBarcode) || 0) + 1);

    cleanRows.push({
      rowIdx: i + 2,
      itemCode,
      itemName,
      barcode,
      unit,
      brand,
      vatRsp,
      stockQty,
      skuCandidate: itemCodePlusBarcode,
    });
  }

  // Duplicate barcodes analysis
  let duplicateBarcodeValuesCount = 0;
  let totalRowsWithDuplicateBarcodes = 0;
  for (const [bc, cnt] of barcodeCounts.entries()) {
    if (cnt > 1) {
      duplicateBarcodeValuesCount++;
      totalRowsWithDuplicateBarcodes += cnt;
    }
  }

  // Duplicate ItemCode-Barcode combos analysis
  let duplicateItemCodeBarcodeCombos = 0;
  let totalRowsWithDuplicateCombos = 0;
  for (const [combo, cnt] of itemCodePlusBarcodeCounts.entries()) {
    if (cnt > 1) {
      duplicateItemCodeBarcodeCombos++;
      totalRowsWithDuplicateCombos += cnt;
    }
  }

  // 4. SKU Collision with current 54,989 products in DB
  let collisionsWithExistingDbSkus = 0;
  const collidingSkusSample: string[] = [];
  for (const row of cleanRows) {
    if (existingSkuSet.has(row.skuCandidate)) {
      collisionsWithExistingDbSkus++;
      if (collidingSkusSample.length < 10) {
        collidingSkusSample.push(row.skuCandidate);
      }
    }
  }

  // Check how many of the 54,989 existing products have sku = itemCode vs sku = itemCode-extraUnit
  let dbSkusWithHyphen = 0;
  let dbSkusPlain = 0;
  for (const sku of existingSkuSet) {
    if (sku.includes("-")) dbSkusWithHyphen++;
    else dbSkusPlain++;
  }

  console.log("\n--- 1. CURRENT DATABASE COUNTS ---");
  console.log(`Current Paramount Baqala Product Count: ${currentDbProductCount}`);
  console.log(`Current product_barcodes table count (Paramount Baqala): ${currentDbBarcodeCount}`);
  console.log(`Existing DB SKUs: Total ${existingSkuSet.size} (Plain ItemCode SKUs: ${dbSkusPlain}, Hyphenated SKUs: ${dbSkusWithHyphen})`);

  console.log("\n--- 2. EXCEL FILE METRICS ---");
  console.log(`Total rows in Excel sheet: ${totalRawRows}`);
  console.log(`Total data rows (excluding header): ${totalDataRows}`);
  console.log(`Rows with Blank/Null ItemCode: ${blankItemCodeCount}`);
  console.log(`Rows with Blank/Null ItemName: ${blankItemNameCount}`);
  console.log(`Rows with Blank/Null Barcode: ${blankBarcodeCount}`);
  console.log(`Distinct Barcode values: ${barcodeCounts.size}`);
  console.log(`Distinct Barcodes appearing on 2+ rows: ${duplicateBarcodeValuesCount} (covering ${totalRowsWithDuplicateBarcodes} rows)`);
  console.log(`Distinct ItemCode-Barcode combos appearing on 2+ rows: ${duplicateItemCodeBarcodeCombos} (covering ${totalRowsWithDuplicateCombos} rows)`);

  console.log("\n--- 4. SKU OVERLAP / COLLISION ANALYSIS ---");
  console.log(`Proposed candidate SKU: ItemCode-Barcode (or ItemCode-Unit when barcode blank)`);
  console.log(`Collisions with existing DB SKUs: ${collisionsWithExistingDbSkus}`);
  if (collidingSkusSample.length > 0) {
    console.log(`Sample Colliding SKUs:`, collidingSkusSample);
  }

  console.log("\n--- 5. BREAKDOWN OF THE 61,018 ROWS VS CURRENT DB ---");
  // Original batch: 44,245 primary products
  // Review batch: 10,744 products (sku: ItemCode-Unit)
  // Merged barcodes: 6,026 rows (were in product_barcodes)
  // Sum = 44,245 + 10,744 + 6,026 = 61,015 (+ 3 blank/skipped = 61,018)
  console.log(`44,245 (Batch 1) + 10,744 (Batch 2) + 6,026 (Alternate Barcodes) = ${44245 + 10744 + 6026} rows.`);

  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL ERROR in investigation:", e);
  process.exit(1);
});

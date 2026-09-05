import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { db } from "../src/server/db/index.js";
import { products, stockLevels, productBarcodes } from "../src/server/db/schema.js";
import { sql } from "drizzle-orm";

const TENANT_ID = "b6ae6062-b05f-451c-a1ab-5bdaac17b763"; // Paramount Baqala

const BRANCH_AL_DANAH = "7de35b6c-3201-4353-af1d-7e33f55f70c0";
const BRANCH_AL_KHALDIYAH = "35bb8764-390b-4221-be92-9379b0dbd891";
const BRANCH_AL_NAHYAN = "b8a2cc43-d047-411c-9d15-ce3b4f6d41a5";

interface RawExcelRow {
  itemCode: string;
  itemName: string;
  barcode: string;
  unit: string;
  brand: string;
  vatRsp: number;
  stockQty: number;
}

interface ReviewRow {
  itemCode: string;
  itemName: string;
  primaryUnit: string;
  extraUnit: string;
  extraBarcode: string;
  extraPrice: number | string;
}

async function main() {
  console.log("================================================================================");
  console.log("PARAMOUNT BAQALA - BULK PRODUCT IMPORT SCRIPT");
  console.log("================================================================================");
  console.log(`Target Tenant ID: ${TENANT_ID} (Paramount Baqala)`);

  const excelFilePath = path.resolve("src/assets/product.xlsx");
  console.log(`Source File Path: ${excelFilePath}`);

  if (!fs.existsSync(excelFilePath)) {
    console.error(`FATAL: File not found at ${excelFilePath}`);
    process.exit(1);
  }

  console.log("\n[STEP 1] Reading and parsing Excel file...");
  const workbook = xlsx.readFile(excelFilePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`Total rows in Excel sheet: ${rawData.length} (including header)`);

  const dataRows = rawData.slice(1);
  console.log(`Total data rows to process: ${dataRows.length}`);

  // Parse rows
  const parsedRows: RawExcelRow[] = [];
  const skippedRowsMissingData: { rowIdx: number; row: any; reason: string }[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row || row.length === 0) continue;

    const itemCode = row[0] !== undefined && row[0] !== null ? String(row[0]).trim() : "";
    const itemName = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : "";
    const barcode = row[2] !== undefined && row[2] !== null ? String(row[2]).trim() : "";
    const unit = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : "PCS";
    const brand = row[4] !== undefined && row[4] !== null ? String(row[4]).trim() : "";
    const vatRsp = Number(row[5]) || 0;
    const stockQty = Number(row[6]) || 0;

    if (!itemCode) {
      skippedRowsMissingData.push({ rowIdx: i + 2, row, reason: "Missing ItemCode" });
      continue;
    }
    if (!itemName) {
      skippedRowsMissingData.push({ rowIdx: i + 2, row, reason: "Missing ItemName" });
      continue;
    }

    parsedRows.push({
      itemCode,
      itemName,
      barcode,
      unit,
      brand,
      vatRsp,
      stockQty,
    });
  }

  console.log(`Successfully parsed valid rows: ${parsedRows.length}`);
  console.log(`Skipped rows due to missing required data: ${skippedRowsMissingData.length}`);

  // Group by ItemCode
  console.log("\n[STEP 2] Grouping rows by ItemCode and determining primary vs alternate rows...");
  const itemGroups = new Map<string, RawExcelRow[]>();

  for (const row of parsedRows) {
    const existing = itemGroups.get(row.itemCode);
    if (!existing) {
      itemGroups.set(row.itemCode, [row]);
    } else {
      existing.push(row);
    }
  }

  console.log(`Total unique ItemCode groups (unique products): ${itemGroups.size}`);

  const productsToInsert: any[] = [];
  const barcodesToInsert: any[] = [];
  const stockLevelsToInsert: any[] = [];
  const reviewNeededRows: ReviewRow[] = [];

  for (const [itemCode, group] of itemGroups.entries()) {
    const productId = crypto.randomUUID();

    // Determine primary row: UNIT = "PCS" if exists, otherwise group[0]
    let primaryRow = group.find((r) => r.unit.toUpperCase() === "PCS");
    if (!primaryRow) {
      primaryRow = group[0];
    }

    // Back-calculate VAT-exclusive base price from VAT RSP (5% VAT)
    const baseSalePrice = Math.max(0, primaryRow.vatRsp / 1.05);
    const roundedSalePrice = (Math.round(baseSalePrice * 100) / 100).toFixed(2);

    productsToInsert.push({
      id: productId,
      tenantId: TENANT_ID,
      name: primaryRow.itemName,
      barcode: primaryRow.barcode ? primaryRow.barcode : null,
      sku: itemCode,
      category: "Uncategorized",
      unit: primaryRow.unit || "PCS",
      costPrice: "0.00",
      salePrice: roundedSalePrice,
      isBatchTracked: false,
      isExpiryTracked: true,
      createdAt: new Date(),
    });

    // Stock levels for 3 branches
    const primaryStock = Math.max(0, Math.round(primaryRow.stockQty || 0));

    // 1. Al Danah
    stockLevelsToInsert.push({
      id: crypto.randomUUID(),
      productId: productId,
      branchId: BRANCH_AL_DANAH,
      stock: primaryStock,
      reorderLevel: 10,
      priceOverride: null,
    });

    // 2. Al Khaldiyah Village
    stockLevelsToInsert.push({
      id: crypto.randomUUID(),
      productId: productId,
      branchId: BRANCH_AL_KHALDIYAH,
      stock: 0,
      reorderLevel: 10,
      priceOverride: null,
    });

    // 3. Al Nahyan
    stockLevelsToInsert.push({
      id: crypto.randomUUID(),
      productId: productId,
      branchId: BRANCH_AL_NAHYAN,
      stock: 0,
      reorderLevel: 10,
      priceOverride: null,
    });

    // Handle secondary rows in group
    const seenBarcodes = new Set<string>();
    if (primaryRow.barcode) {
      seenBarcodes.add(primaryRow.barcode);
    }

    for (const otherRow of group) {
      if (otherRow === primaryRow) continue;

      if (otherRow.unit.toUpperCase() === primaryRow.unit.toUpperCase()) {
        // Same unit, alternate barcode
        if (otherRow.barcode && !seenBarcodes.has(otherRow.barcode)) {
          seenBarcodes.add(otherRow.barcode);
          barcodesToInsert.push({
            id: crypto.randomUUID(),
            productId: productId,
            barcode: otherRow.barcode,
          });
        }
      } else {
        // Different unit -> write to manual review CSV
        reviewNeededRows.push({
          itemCode: otherRow.itemCode,
          itemName: otherRow.itemName,
          primaryUnit: primaryRow.unit,
          extraUnit: otherRow.unit,
          extraBarcode: otherRow.barcode,
          extraPrice: otherRow.vatRsp,
        });
      }
    }
  }

  // Write manual review CSV
  const reviewCsvPath = path.resolve("import_review_needed.csv");
  console.log(`\n[STEP 3] Writing manual review CSV (${reviewNeededRows.length} rows) to: ${reviewCsvPath}`);

  const csvHeader = "ItemCode,ItemName,PrimaryUnit,ExtraUnit,ExtraBarcode,ExtraPrice\n";
  const csvBody = reviewNeededRows
    .map((r) =>
      [
        `"${r.itemCode.replace(/"/g, '""')}"`,
        `"${r.itemName.replace(/"/g, '""')}"`,
        `"${r.primaryUnit.replace(/"/g, '""')}"`,
        `"${r.extraUnit.replace(/"/g, '""')}"`,
        `"${(r.extraBarcode || "").replace(/"/g, '""')}"`,
        `"${r.extraPrice}"`,
      ].join(",")
    )
    .join("\n");

  fs.writeFileSync(reviewCsvPath, csvHeader + csvBody, "utf-8");
  console.log(`Saved import_review_needed.csv (${reviewNeededRows.length} items).`);

  // Batch insert into database
  console.log("\n[STEP 4] Executing batch database inserts in chunks of 500...");
  const BATCH_SIZE = 500;

  // Insert Products
  console.log(`Inserting ${productsToInsert.length} products...`);
  let productsInsertedCount = 0;
  for (let i = 0; i < productsToInsert.length; i += BATCH_SIZE) {
    const chunk = productsToInsert.slice(i, i + BATCH_SIZE);
    await db
      .insert(products)
      .values(chunk)
      .onConflictDoNothing({ target: [products.tenantId, products.sku] });
    productsInsertedCount += chunk.length;
    if ((i / BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= productsToInsert.length) {
      console.log(`  -> Inserted ${Math.min(productsInsertedCount, productsToInsert.length)} / ${productsToInsert.length} products`);
    }
  }

  // Insert Stock Levels
  console.log(`\nInserting ${stockLevelsToInsert.length} stock level rows (3 per product)...`);
  let stockInsertedCount = 0;
  for (let i = 0; i < stockLevelsToInsert.length; i += BATCH_SIZE) {
    const chunk = stockLevelsToInsert.slice(i, i + BATCH_SIZE);
    await db.insert(stockLevels).values(chunk);
    stockInsertedCount += chunk.length;
    if ((i / BATCH_SIZE) % 20 === 0 || i + BATCH_SIZE >= stockLevelsToInsert.length) {
      console.log(`  -> Inserted ${Math.min(stockInsertedCount, stockLevelsToInsert.length)} / ${stockLevelsToInsert.length} stock level records`);
    }
  }

  // Insert Alternate Barcodes
  console.log(`\nInserting ${barcodesToInsert.length} alternate barcodes...`);
  let barcodesInsertedCount = 0;
  if (barcodesToInsert.length > 0) {
    for (let i = 0; i < barcodesToInsert.length; i += BATCH_SIZE) {
      const chunk = barcodesToInsert.slice(i, i + BATCH_SIZE);
      await db.insert(productBarcodes).values(chunk);
      barcodesInsertedCount += chunk.length;
    }
    console.log(`  -> Inserted ${barcodesInsertedCount} alternate barcodes`);
  }

  // Final verification counts
  console.log("\n[STEP 5] Final database verification queries...");
  const finalProdCountRes: any[] = await db.execute(sql`
    SELECT COUNT(*)::int as count FROM products WHERE tenant_id = ${TENANT_ID}::uuid;
  `);
  const finalStockCountRes: any[] = await db.execute(sql`
    SELECT COUNT(*)::int as count FROM stock_levels WHERE branch_id IN (
      ${BRANCH_AL_DANAH}::uuid, 
      ${BRANCH_AL_KHALDIYAH}::uuid, 
      ${BRANCH_AL_NAHYAN}::uuid
    );
  `);
  const finalBarcodesCountRes: any[] = await db.execute(sql`
    SELECT COUNT(pb.*)::int as count 
    FROM product_barcodes pb
    INNER JOIN products p ON p.id = pb.product_id
    WHERE p.tenant_id = ${TENANT_ID}::uuid;
  `);

  console.log("\n================================================================================");
  console.log("BULK IMPORT COMPLETE - SUMMARY REPORT");
  console.log("================================================================================");
  console.log(`Total Excel data rows read: ${dataRows.length}`);
  console.log(`Unique products (ItemCode groups) identified: ${itemGroups.size}`);
  console.log(`Products in DB for Paramount Baqala: ${finalProdCountRes[0].count}`);
  console.log(`Stock level rows in DB for Paramount Baqala branches: ${finalStockCountRes[0].count}`);
  console.log(`Alternate barcodes in DB for Paramount Baqala: ${finalBarcodesCountRes[0].count}`);
  console.log(`Different-unit rows written to manual review CSV: ${reviewNeededRows.length}`);
  console.log(`Review CSV path: ${reviewCsvPath}`);

  if (skippedRowsMissingData.length > 0) {
    console.log(`\nSkipped Rows with missing data (${skippedRowsMissingData.length}):`);
    console.log(skippedRowsMissingData.slice(0, 5));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("FATAL ERROR DURING BULK IMPORT:", err);
  process.exit(1);
});

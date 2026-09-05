import fs from "fs";
import path from "path";
import crypto from "crypto";
import { db } from "../src/server/db/index.js";
import { products, stockLevels, productBarcodes } from "../src/server/db/schema.js";
import { sql, eq, count } from "drizzle-orm";

const TENANT_ID = "b6ae6062-b05f-451c-a1ab-5bdaac17b763"; // Paramount Baqala

const BRANCH_AL_DANAH = "7de35b6c-3201-4353-af1d-7e33f55f70c0";
const BRANCH_AL_KHALDIYAH = "35bb8764-390b-4221-be92-9379b0dbd891";
const BRANCH_AL_NAHYAN = "b8a2cc43-d047-411c-9d15-ce3b4f6d41a5";

interface CsvRow {
  itemCode: string;
  itemName: string;
  primaryUnit: string;
  extraUnit: string;
  extraBarcode: string;
  extraPrice: number;
}

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser for standard quoted / unquoted fields
    const matches = line.match(/(?:\"([^\"]*(?:\"\"[^\"]*)*)\")|([^\",]+)/g);
    if (!matches || matches.length < 6) continue;

    const clean = matches.map((m) => {
      let s = m.trim();
      if (s.startsWith('"') && s.endsWith('"')) {
        s = s.slice(1, -1).replace(/""/g, '"');
      }
      return s;
    });

    const itemCode = clean[0]?.trim() || "";
    const itemName = clean[1]?.trim() || "";
    const primaryUnit = clean[2]?.trim() || "PCS";
    const extraUnit = clean[3]?.trim() || "PCS";
    const extraBarcode = clean[4]?.trim() || "";
    const extraPrice = Number(clean[5]) || 0;

    if (itemCode && itemName) {
      rows.push({
        itemCode,
        itemName,
        primaryUnit,
        extraUnit,
        extraBarcode,
        extraPrice,
      });
    }
  }

  return rows;
}

async function run() {
  console.log("================================================================================");
  console.log("IMPORT REVIEW NEEDED PRODUCTS - STANDALONE SEPARATE PRODUCTS");
  console.log("================================================================================");

  const csvPath = path.resolve("import_review_needed.csv");
  console.log(`Source CSV File: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    console.error(`FATAL: File not found: ${csvPath}`);
    process.exit(1);
  }

  const initialCountRes = await db
    .select({ val: count() })
    .from(products)
    .where(eq(products.tenantId, TENANT_ID));
  const initialProductCount = Number(initialCountRes[0]?.val || 0);
  console.log(`Current Paramount Baqala Product Count: ${initialProductCount}`);

  const rows = parseCsv(csvPath);
  console.log(`Total CSV rows parsed: ${rows.length}`);

  // Deduplicate and track sku generation
  // If multiple rows have the same ItemCode and same ExtraUnit (e.g. 2 different barcodes for same CTN),
  // we generate sku = ItemCode + "-" + ExtraUnit for the first, and attach extra barcodes or give unique sku.
  const skuSeenCount = new Map<string, number>();
  const preparedProducts: {
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
    barcodesToInsert: string[];
  }[] = [];

  for (const r of rows) {
    const baseSku = `${r.itemCode}-${r.extraUnit}`;
    const seen = skuSeenCount.get(baseSku) || 0;
    skuSeenCount.set(baseSku, seen + 1);

    const finalSku = seen === 0 ? baseSku : `${baseSku}-${seen + 1}`;
    const vatInclusivePrice = r.extraPrice;
    const vatExclusiveBasePrice = Math.round((vatInclusivePrice / 1.05) * 100) / 100;

    const prodId = crypto.randomUUID();

    preparedProducts.push({
      id: prodId,
      tenantId: TENANT_ID,
      name: r.itemName,
      sku: finalSku,
      barcode: r.extraBarcode || finalSku,
      unit: r.extraUnit,
      category: "Uncategorized",
      costPrice: "0.00",
      salePrice: vatExclusiveBasePrice.toFixed(2),
      isBatchTracked: false,
      isActive: true,
      barcodesToInsert: r.extraBarcode ? [r.extraBarcode] : [],
    });
  }

  console.log(`Prepared ${preparedProducts.length} standalone product records to insert.`);

  // Chunked batch insertion
  const CHUNK_SIZE = 500;
  let insertedCount = 0;
  const branches = [BRANCH_AL_DANAH, BRANCH_AL_KHALDIYAH, BRANCH_AL_NAHYAN];

  for (let i = 0; i < preparedProducts.length; i += CHUNK_SIZE) {
    const chunk = preparedProducts.slice(i, i + CHUNK_SIZE);

    const productValues = chunk.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      unit: p.unit,
      category: p.category,
      costPrice: p.costPrice,
      salePrice: p.salePrice,
      isBatchTracked: p.isBatchTracked,
      isActive: p.isActive,
    }));

    // Insert products with ON CONFLICT (tenant_id, sku) DO NOTHING
    const insertedChunk = await db
      .insert(products)
      .values(productValues)
      .onConflictDoNothing({
        target: [products.tenantId, products.sku],
      })
      .returning({ id: products.id });

    insertedCount += insertedChunk.length;

    // Insert stock levels for each branch (default stock 0, reorder 10)
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

    // Insert product_barcodes for lookup
    const barcodeRows: any[] = [];
    for (const p of chunk) {
      if (p.barcodesToInsert.length > 0) {
        for (const bc of p.barcodesToInsert) {
          barcodeRows.push({
            id: crypto.randomUUID(),
            tenantId: TENANT_ID,
            productId: p.id,
            barcode: bc,
            unit: p.unit,
            isPrimary: true,
          });
        }
      }
    }

    if (barcodeRows.length > 0) {
      await db
        .insert(productBarcodes)
        .values(barcodeRows)
        .onConflictDoNothing();
    }

    const progress = Math.min(i + CHUNK_SIZE, preparedProducts.length);
    process.stdout.write(`\rInserted chunk ${progress}/${preparedProducts.length} (New Products created: ${insertedCount})...`);
  }

  console.log("\n\n[STEP 3] Verifying final count in database...");
  const finalCountRes = await db
    .select({ val: count() })
    .from(products)
    .where(eq(products.tenantId, TENANT_ID));
  const finalProductCount = Number(finalCountRes[0]?.val || 0);

  console.log("================================================================================");
  console.log("IMPORT COMPLETE SUMMARY:");
  console.log(`- Total CSV rows processed: ${rows.length}`);
  console.log(`- Total new products inserted: ${insertedCount}`);
  console.log(`- Initial Paramount Baqala Product Count: ${initialProductCount}`);
  console.log(`- Final Paramount Baqala Product Count: ${finalProductCount}`);
  console.log("================================================================================");
  process.exit(0);
}

run().catch((err) => {
  console.error("FATAL ERROR during import:", err);
  process.exit(1);
});

import xlsx from "xlsx";
import path from "path";
import { db } from "../src/server/db/index.js";
import { products, productBarcodes } from "../src/server/db/schema.js";
import { eq } from "drizzle-orm";

const TENANT_ID = "b6ae6062-b05f-451c-a1ab-5bdaac17b763";

async function main() {
  const excelFilePath = path.resolve("src/assets/product.xlsx");
  const workbook = xlsx.readFile(excelFilePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  const dataRows = rawData.slice(1);

  // Group by barcode to inspect duplicates
  const barcodeMap = new Map<string, any[]>();
  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const barcode = String(r[2] || "").trim();
    if (!barcodeMap.has(barcode)) barcodeMap.set(barcode, []);
    barcodeMap.get(barcode)!.push({ rowIdx: i + 2, itemCode: r[0], itemName: r[1], barcode: r[2], unit: r[3], price: r[5] });
  }

  console.log("=== DUPLICATE BARCODE ROWS IN EXCEL ===");
  for (const [bc, rows] of barcodeMap.entries()) {
    if (rows.length > 1) {
      console.log(`Barcode: "${bc}" (${rows.length} occurrences):`);
      for (const r of rows) {
        console.log(`  Row ${r.rowIdx}: ItemCode=${r.itemCode}, Name="${r.itemName}", Unit=${r.unit}, Price=${r.price}`);
      }
    }
  }

  // Check how many Excel barcodes already exist as `products.barcode` in DB
  const dbProducts = await db
    .select({ id: products.id, sku: products.sku, barcode: products.barcode, name: products.name })
    .from(products)
    .where(eq(products.tenantId, TENANT_ID));

  const dbBarcodeSet = new Set(dbProducts.map((p) => p.barcode).filter(Boolean));
  const dbSkuSet = new Set(dbProducts.map((p) => p.sku).filter(Boolean));

  let excelRowsInDbBarcode = 0;
  let excelRowsNotInDbBarcode = 0;

  const missingExcelRows: any[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i];
    const barcode = String(r[2] || "").trim();
    if (dbBarcodeSet.has(barcode)) {
      excelRowsInDbBarcode++;
    } else {
      excelRowsNotInDbBarcode++;
      if (missingExcelRows.length < 5) {
        missingExcelRows.push({ rowIdx: i + 2, itemCode: r[0], itemName: r[1], barcode: r[2], unit: r[3] });
      }
    }
  }

  console.log("\n=== EXCEL ROWS VS DATABASE MATCHING ===");
  console.log(`Excel rows whose barcode is already a product in DB: ${excelRowsInDbBarcode}`);
  console.log(`Excel rows whose barcode is NOT a product in DB (the missing standalone products): ${excelRowsNotInDbBarcode}`);
  console.log("Sample missing rows:", missingExcelRows);

  process.exit(0);
}

main().catch(console.error);

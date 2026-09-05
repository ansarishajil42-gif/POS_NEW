import xlsx from "xlsx";
import path from "path";

const EXCEL_PATH = path.resolve("..", "White_Label_POS", "src", "assets", "New_Product.xlsx");

function inspect() {
  console.log("Reading file:", EXCEL_PATH);
  const workbook = xlsx.readFile(EXCEL_PATH, { raw: false, cellText: true });
  const sheetName = workbook.SheetNames[0];
  console.log("Sheet name:", sheetName);
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet, { defval: "", raw: false });
  
  console.log(`Total rows read: ${rows.length}`);
  if (rows.length > 0) {
    console.log("First row keys:", Object.keys(rows[0]));
    console.log("First row sample:", rows[0]);
    console.log("Second row sample:", rows[1]);
  }

  let emptyBarcode1Count = 0;
  let hasSkuFallbackCount = 0;
  let weightedCount = 0;

  for (const r of rows) {
    const b1 = (r["barcode 1"] || "").toString().trim();
    const sku = (r["sku"] || "").toString().trim();
    const isWeighted = (r["isWeighted"] || "").toString().trim().toLowerCase();

    if (!b1) {
      emptyBarcode1Count++;
      if (sku) hasSkuFallbackCount++;
    }
    if (isWeighted === "true" || isWeighted === "1") {
      weightedCount++;
    }
  }

  console.log(`Rows with empty 'barcode 1': ${emptyBarcode1Count}`);
  console.log(`Rows with empty 'barcode 1' but have 'sku' fallback: ${hasSkuFallbackCount}`);
  console.log(`Rows with isWeighted=true: ${weightedCount}`);
}

inspect();

import xlsx from "xlsx";
import path from "path";

async function main() {
  const filePath = path.resolve("src/assets/product.xlsx");
  console.log("Reading file:", filePath);
  const workbook = xlsx.readFile(filePath);
  console.log("Sheet names:", workbook.SheetNames);
  
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  console.log("Total raw rows (including header):", rawRows.length);
  console.log("Header row:", rawRows[0]);
  console.log("Row 1:", rawRows[1]);
  console.log("Row 2:", rawRows[2]);
  console.log("Row 3:", rawRows[3]);
  console.log("Row 4:", rawRows[4]);
  console.log("Row 5:", rawRows[5]);
  
  // Object parse test
  const objectRows: any[] = xlsx.utils.sheet_to_json(sheet);
  console.log("Total parsed object rows:", objectRows.length);
  console.log("First 2 object rows:", JSON.stringify(objectRows.slice(0, 2), null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to read excel:", err);
  process.exit(1);
});

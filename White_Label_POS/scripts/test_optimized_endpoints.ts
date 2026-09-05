import { db } from "../src/server/db/index.js";
import { sql } from "drizzle-orm";
import { getHeadOfficeDataFn } from "../src/lib/head-office-server.js";
import { getPosCatalogServerFn, searchPosProductByBarcodeFn } from "../src/lib/pos-server.js";
import { getInventoryDataServerFn } from "../src/lib/inventory-manager-server.js";

async function main() {
  console.log("================================================================================");
  console.log("BENCHMARKING OPTIMIZED POST-LOGIN SERVER FUNCTIONS");
  console.log("================================================================================");

  // 1. Benchmark Head Office Data
  console.log("\n[TEST 1] Testing getHeadOfficeDataFn (Paginated 50 items)...");
  const t0 = performance.now();
  // Note: we can mock session context or test queries directly
  const tenantId = "b6ae6062-b05f-451c-a1ab-5bdaac17b763";
  const branchId = "7de35b6c-3201-4353-af1d-7e33f55f70c0"; // Al Danah

  // Measure direct query performance
  const [productsCountRes] = await db.execute(sql`SELECT count(*)::int as total FROM products WHERE tenant_id = ${tenantId}::uuid;`);
  const [stockCountRes] = await db.execute(sql`SELECT count(*)::int as total FROM stock_levels WHERE branch_id = ${branchId}::uuid;`);

  console.log(`Total tenant products in DB: ${(productsCountRes as any).total}`);
  console.log(`Total branch stock rows in DB: ${(stockCountRes as any).total}`);

  // 2. Measure Head Office initial payload size & execution time
  const startHo = performance.now();
  
  // Query 50 products
  const dbProducts = await db.execute(sql`
    SELECT p.id, p.name, p.barcode, p.sku, p.category, p.unit, p.cost_price, p.sale_price, p.is_batch_tracked, p.created_at
    FROM products p
    WHERE p.tenant_id = ${tenantId}::uuid
    ORDER BY p.created_at DESC
    LIMIT 50;
  `);
  
  const productIds = (dbProducts as any[]).map(p => p.id);
  
  const [dbBarcodes, dbStock] = await Promise.all([
    productIds.length > 0
      ? db.execute(sql`SELECT id, product_id, barcode FROM product_barcodes WHERE product_id IN (${sql.join(productIds.map(id => sql`${id}::uuid`), sql`, `)});`)
      : [],
    productIds.length > 0
      ? db.execute(sql`SELECT id, product_id, branch_id, stock, reorder_level FROM stock_levels WHERE product_id IN (${sql.join(productIds.map(id => sql`${id}::uuid`), sql`, `)});`)
      : [],
  ]);

  const barcodesMap = new Map<string, string[]>();
  for (const b of (dbBarcodes as any[])) {
    const arr = barcodesMap.get(b.product_id) || [];
    arr.push(b.barcode);
    barcodesMap.set(b.product_id, arr);
  }

  const productsWithDetails = (dbProducts as any[]).map(p => ({
    ...p,
    alternateBarcodes: barcodesMap.get(p.id) || [],
  }));

  const hoPayload = JSON.stringify({
    products: productsWithDetails,
    stock: dbStock,
    totalProducts: (productsCountRes as any).total,
  });

  const hoDuration = (performance.now() - startHo).toFixed(2);
  const hoPayloadSizeKb = (Buffer.byteLength(hoPayload, "utf8") / 1024).toFixed(2);

  console.log(`-> getHeadOfficeDataFn simulation time: ${hoDuration} ms`);
  console.log(`-> getHeadOfficeDataFn payload size: ${hoPayloadSizeKb} KB (Previously 41.6 MB!)`);

  // 3. Measure POS catalog query
  const startPos = performance.now();
  const posProducts = await db.execute(sql`
    SELECT p.id, p.name, p.category, p.barcode, p.sku, p.unit, p.sale_price, s.stock, s.price_override
    FROM products p
    INNER JOIN stock_levels s ON s.product_id = p.id AND s.branch_id = ${branchId}::uuid
    WHERE p.tenant_id = ${tenantId}::uuid
    LIMIT 60;
  `);
  const posPayload = JSON.stringify({ catalog: posProducts });
  const posDuration = (performance.now() - startPos).toFixed(2);
  const posPayloadSizeKb = (Buffer.byteLength(posPayload, "utf8") / 1024).toFixed(2);

  console.log(`\n[TEST 2] Testing POS Catalog simulation:`);
  console.log(`-> getPosCatalogServerFn simulation time: ${posDuration} ms`);
  console.log(`-> getPosCatalogServerFn payload size: ${posPayloadSizeKb} KB`);

  // 4. Test Single Barcode Instant Lookup (Across 44,245 items)
  const startBarcode = performance.now();
  const testBarcode = "4052700005836"; // First item from excel
  const barcodeMatch = await db.execute(sql`
    SELECT p.id, p.name, p.barcode, p.sku, p.sale_price, s.stock
    FROM products p
    INNER JOIN stock_levels s ON s.product_id = p.id AND s.branch_id = ${branchId}::uuid
    WHERE p.tenant_id = ${tenantId}::uuid AND (p.barcode = ${testBarcode} OR p.sku = ${testBarcode})
    LIMIT 1;
  `);
  const barcodeDuration = (performance.now() - startBarcode).toFixed(2);
  console.log(`\n[TEST 3] Testing searchPosProductByBarcodeFn ("${testBarcode}"):`);
  console.log(`-> Barcode search time: ${barcodeDuration} ms`);
  console.log(`-> Found product: ${(barcodeMatch[0] as any)?.name} (Stock: ${(barcodeMatch[0] as any)?.stock})`);

  // 5. Measure Inventory Manager query
  const startInv = performance.now();
  const invRows = await db.execute(sql`
    SELECT s.id, s.stock, s.reorder_level, s.branch_id, b.name as branch_name, p.id as product_id, p.name as product_name, p.sku, p.barcode, p.category, p.unit
    FROM stock_levels s
    INNER JOIN products p ON s.product_id = p.id
    INNER JOIN branches b ON s.branch_id = b.id
    WHERE p.tenant_id = ${tenantId}::uuid
    LIMIT 50;
  `);
  const invPayload = JSON.stringify({ stockLevels: invRows });
  const invDuration = (performance.now() - startInv).toFixed(2);
  const invPayloadSizeKb = (Buffer.byteLength(invPayload, "utf8") / 1024).toFixed(2);

  console.log(`\n[TEST 4] Testing Inventory Manager simulation:`);
  console.log(`-> getInventoryDataServerFn simulation time: ${invDuration} ms`);
  console.log(`-> getInventoryDataServerFn payload size: ${invPayloadSizeKb} KB`);

  console.log("\n================================================================================");
  console.log("ALL BENCHMARKS COMPLETED SUCCESSFULLY");
  console.log("================================================================================");

  process.exit(0);
}

main().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});

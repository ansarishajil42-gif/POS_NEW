import { db } from "../src/server/db/index.js";
import { sql } from "drizzle-orm";

async function main() {
  console.log("================================================================================");
  console.log("DATABASE SCHEMA & DATA INVESTIGATION FOR PRODUCTS & BRANCHES");
  console.log("================================================================================");

  // 1. Columns of products table
  const prodCols = await db.execute(sql`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'products'
    ORDER BY ordinal_position;
  `);
  console.log("\n[1. PRODUCTS TABLE COLUMNS]");
  console.log(JSON.stringify(prodCols, null, 2));

  // 1b. Existing products in DB
  const existingProds = await db.execute(sql`
    SELECT id, tenant_id, name, barcode, sku, category, unit, cost_price, sale_price 
    FROM products;
  `);
  console.log("\n[1b. EXISTING PRODUCTS IN DB]");
  console.log(JSON.stringify(existingProds, null, 2));

  // 2. Columns of related tables
  const barcodeCols = await db.execute(sql`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'product_barcodes'
    ORDER BY ordinal_position;
  `);
  console.log("\n[2. PRODUCT_BARCODES TABLE COLUMNS]");
  console.table(barcodeCols);

  const variantCols = await db.execute(sql`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'product_variants'
    ORDER BY ordinal_position;
  `);
  console.log("\n[3. PRODUCT_VARIANTS TABLE COLUMNS]");
  console.table(variantCols);

  const stockCols = await db.execute(sql`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'stock_levels'
    ORDER BY ordinal_position;
  `);
  console.log("\n[4. STOCK_LEVELS TABLE COLUMNS]");
  console.table(stockCols);

  // 3. Constraints & Indexes on products
  const prodIndexes = await db.execute(sql`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'products';
  `);
  console.log("\n[5. PRODUCTS TABLE INDEXES & CONSTRAINTS]");
  console.table(prodIndexes);

  const barcodeIndexes = await db.execute(sql`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'product_barcodes';
  `);
  console.log("\n[6. PRODUCT_BARCODES TABLE INDEXES]");
  console.table(barcodeIndexes);

  // 4. Row counts
  const prodCount = await db.execute(sql`
    SELECT t.name as tenant_name, t.id as tenant_id, count(p.id)::int as product_count 
    FROM tenants t 
    LEFT JOIN products p ON p.tenant_id = t.id 
    GROUP BY t.id, t.name;
  `);
  console.log("\n[7. PRODUCT COUNTS BY TENANT]");
  console.table(prodCount);

  const branchCount = await db.execute(sql`SELECT count(*)::int as branch_count FROM branches;`);
  const stockCount = await db.execute(sql`SELECT count(*)::int as stock_levels_count FROM stock_levels;`);

  console.log("\n[7. ROW COUNTS]");
  console.log({
    products: prodCount[0].product_count,
    branches: branchCount[0].branch_count,
    tenants: tenantCount[0].tenant_count,
    stock_levels: stockCount[0].stock_levels_count,
  });

  // 5. Existing Tenants & Branches Details
  const tenantsList = await db.execute(sql`SELECT id, name, subdomain, status, created_at FROM tenants;`);
  console.log("\n[8. TENANTS LIST]");
  console.table(tenantsList);

  const branchesList = await db.execute(sql`SELECT id, tenant_id, name, address, status, till_count FROM branches;`);
  console.log("\n[9. BRANCHES LIST]");
  console.table(branchesList);

  process.exit(0);
}

main().catch((err) => {
  console.error("Investigation failed:", err);
  process.exit(1);
});

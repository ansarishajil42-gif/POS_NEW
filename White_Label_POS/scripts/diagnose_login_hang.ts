import { db } from "../src/server/db/index.js";
import { sql, eq, inArray } from "drizzle-orm";
import {
  tenants,
  branches,
  products,
  stockLevels,
  productBarcodes,
  productVariants,
  unitConversions,
  staffUsers,
} from "../src/server/db/schema.js";

async function main() {
  console.log("================================================================================");
  console.log("DIAGNOSING POST-LOGIN DATA FETCHING BOTTLENECK");
  console.log("================================================================================");

  // 1. Check Staff Users
  const staff = await db.select({
    id: staffUsers.id,
    name: staffUsers.name,
    email: staffUsers.email,
    role: staffUsers.role,
    tenantId: staffUsers.tenantId,
  }).from(staffUsers);
  console.log("\n[1. STAFF USERS IN DB]");
  console.table(staff);

  const tenantId = "b6ae6062-b05f-451c-a1ab-5bdaac17b763"; // Paramount Baqala

  // 2. Measure Head Office Data Queries
  console.log("\n[2. MEASURING getHeadOfficeDataFn INDIVIDUAL QUERY PERFORMANCE]");
  
  console.time("Query branches");
  const dbBranches = await db.query.branches.findMany({
    where: eq(branches.tenantId, tenantId),
  });
  console.timeEnd("Query branches");

  console.time("Query products (44,245 rows)");
  const dbProducts = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
  });
  console.timeEnd("Query products (44,245 rows)");

  console.time("Query barcodes (6,026 rows)");
  const dbBarcodes = await db.select().from(productBarcodes);
  console.timeEnd("Query barcodes (6,026 rows)");

  console.time("Query variants");
  const dbVariants = await db.select().from(productVariants);
  console.timeEnd("Query variants");

  console.time("Query unitConversions");
  const dbConversions = await db.select().from(unitConversions);
  console.timeEnd("Query unitConversions");

  console.time("Query stockLevels (132,735 rows)");
  const dbStock = await db.query.stockLevels.findMany({
    where: inArray(
      stockLevels.branchId,
      dbBranches.map((b) => b.id).concat(["00000000-0000-0000-0000-000000000000"]),
    ),
  });
  console.timeEnd("Query stockLevels (132,735 rows)");

  // 3. Measure the In-Memory Nested Loop
  console.log("\n[3. MEASURING IN-MEMORY NESTED MAPPING LOOP]");
  console.time("Nested Map (44,245 x 6,026 filter)");
  const productsWithDetails = dbProducts.map((p) => {
    const alternateBarcodes = dbBarcodes
      .filter((b) => b.productId === p.id)
      .map((b) => b.barcode);
    const variants = dbVariants
      .filter((v) => v.productId === p.id)
      .map((v) => ({
        variantName: v.variantName,
        variantValue: v.variantValue,
        sku: v.sku,
        priceAdjustment: v.priceAdjustment,
      }));
    const conversions = dbConversions
      .filter((c) => c.productId === p.id)
      .map((c) => ({
        fromUnit: c.fromUnit,
        toUnit: c.toUnit,
        conversionFactor: c.conversionFactor,
      }));

    return {
      ...p,
      alternateBarcodes,
      variants,
      conversions,
    };
  });
  console.timeEnd("Nested Map (44,245 x 6,026 filter)");

  // 4. Measure Payload Size & Serialization
  console.log("\n[4. MEASURING SERIALIZATION AND PAYLOAD SIZE]");
  console.time("JSON.stringify full payload");
  const fullPayload = JSON.stringify({
    products: productsWithDetails,
    stockLevels: dbStock,
  });
  console.timeEnd("JSON.stringify full payload");

  const sizeMb = (Buffer.byteLength(fullPayload, "utf8") / (1024 * 1024)).toFixed(2);
  console.log(`Total JSON Payload Size for getHeadOfficeDataFn: ${sizeMb} MB`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});

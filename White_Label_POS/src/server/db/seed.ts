import { db } from "./index";
import * as schema from "./schema";
import * as argon2 from "argon2";
import "dotenv/config";
import { sql } from "drizzle-orm";

async function hash(password: string) {
  return await argon2.hash(password);
}

async function main() {
  console.log("Starting seed script...");

  // 1. Clear existing data
  console.log("Clearing existing data...");
  await db.delete(schema.orderItems);
  await db.delete(schema.orders);
  await db.delete(schema.purchaseOrders);
  await db.delete(schema.vendors);
  await db.delete(schema.productBatches);
  await db.delete(schema.products);
  await db.delete(schema.users);
  await db.delete(schema.branches);
  await db.delete(schema.tenants);

  // 2. Tenants
  const tenantMadina = (await db.insert(schema.tenants).values({
    name: "Al Madina Supermarket",
    subdomain: "almadina",
    plan: "Growth",
  }).returning())[0];

  const tenantFresh = (await db.insert(schema.tenants).values({
    name: "Fresh Mart Group",
    subdomain: "freshmart",
    plan: "Starter",
  }).returning())[0];

  // 3. Branches
  const madinaBarsha = (await db.insert(schema.branches).values({
    tenantId: tenantMadina.id,
    name: "Al Barsha Branch",
    address: "Al Barsha 1, Dubai",
    tillCount: 2,
  }).returning())[0];

  const madinaDeira = (await db.insert(schema.branches).values({
    tenantId: tenantMadina.id,
    name: "Deira Branch",
    address: "Deira City Centre, Dubai",
    tillCount: 3,
  }).returning())[0];

  const freshAbuDhabi = (await db.insert(schema.branches).values({
    tenantId: tenantFresh.id,
    name: "Abu Dhabi Branch",
    address: "Corniche Road, Abu Dhabi",
    tillCount: 2,
  }).returning())[0];

  // 4. Users
  const defaultPassword = await hash("Test@1234");
  const cashier1Pin = await hash("1234");
  const cashier2Pin = await hash("5678");
  const cashier3Pin = await hash("1111");

  await db.insert(schema.users).values([
    {
      email: "superadmin@cloudynationpos.com",
      passwordHash: defaultPassword,
      role: "super_admin",
    },
    {
      email: "admin@almadina.com",
      passwordHash: defaultPassword,
      role: "head_office_admin",
      tenantId: tenantMadina.id,
    },
    {
      email: "manager.barsha@almadina.com",
      passwordHash: defaultPassword,
      role: "branch_manager",
      tenantId: tenantMadina.id,
      branchId: madinaBarsha.id,
    },
    {
      email: "inventory@almadina.com",
      passwordHash: defaultPassword,
      role: "inventory_manager",
      tenantId: tenantMadina.id,
      branchId: madinaBarsha.id,
    },
    {
      email: "purchasing@almadina.com",
      passwordHash: defaultPassword,
      role: "purchasing_officer",
      tenantId: tenantMadina.id,
    },
    {
      pinHash: cashier1Pin,
      role: "cashier",
      tenantId: tenantMadina.id,
      branchId: madinaBarsha.id,
    },
    {
      pinHash: cashier2Pin,
      role: "cashier",
      tenantId: tenantMadina.id,
      branchId: madinaBarsha.id,
    },
    {
      email: "admin@freshmart.com",
      passwordHash: defaultPassword,
      role: "head_office_admin",
      tenantId: tenantFresh.id,
    },
    {
      pinHash: cashier3Pin,
      role: "cashier",
      tenantId: tenantFresh.id,
      branchId: freshAbuDhabi.id,
    }
  ]);

  // 5. Products for Al Madina
  const madinaProducts = await db.insert(schema.products).values([
    { tenantId: tenantMadina.id, name: "Coca Cola 330ml Can", barcode: "1234567890123", category: "Beverages", unit: "pcs", costPrice: "1.50", salePrice: "2.50", stock: 500 },
    { tenantId: tenantMadina.id, name: "Almarai Fresh Milk 1L", barcode: "1234567890124", category: "Dairy", unit: "pcs", costPrice: "4.00", salePrice: "6.00", stock: 120, isBatchTracked: true },
    { tenantId: tenantMadina.id, name: "Brown Bread 400g", barcode: "1234567890125", category: "Bakery", unit: "pcs", costPrice: "3.00", salePrice: "5.00", stock: 60, isBatchTracked: true },
    { tenantId: tenantMadina.id, name: "Lays Chips 50g", barcode: "1234567890126", category: "Snacks", unit: "pcs", costPrice: "1.00", salePrice: "2.00", stock: 300 },
    { tenantId: tenantMadina.id, name: "Tide Detergent 3kg", barcode: "1234567890127", category: "Household", unit: "pcs", costPrice: "20.00", salePrice: "32.00", stock: 40 },
    { tenantId: tenantMadina.id, name: "Eggs Large 30pcs", barcode: "1234567890128", category: "Dairy", unit: "tray", costPrice: "12.00", salePrice: "18.50", stock: 80, isBatchTracked: true },
    { tenantId: tenantMadina.id, name: "Chicken Breast 1kg", barcode: "1234567890129", category: "Meat", unit: "kg", costPrice: "15.00", salePrice: "22.00", stock: 50, isBatchTracked: true },
    { tenantId: tenantMadina.id, name: "Tomatoes", barcode: "1234567890130", category: "Produce", unit: "kg", costPrice: "2.50", salePrice: "4.50", stock: 150 },
    { tenantId: tenantMadina.id, name: "Onions", barcode: "1234567890131", category: "Produce", unit: "kg", costPrice: "1.50", salePrice: "3.00", stock: 200 },
    { tenantId: tenantMadina.id, name: "Basmati Rice 5kg", barcode: "1234567890132", category: "Pantry", unit: "bag", costPrice: "25.00", salePrice: "38.50", stock: 100 },
  ]).returning();

  // Batches for tracked items
  const milk = madinaProducts.find(p => p.name.includes("Milk"))!;
  await db.insert(schema.productBatches).values({
    productId: milk.id,
    batchNumber: "B-101",
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    stock: 120,
  });

  // 6. Vendors & Purchase Orders
  const vendor1 = (await db.insert(schema.vendors).values({
    tenantId: tenantMadina.id,
    name: "Global FMCG Distributors",
    contact: "contact@globalfmcg.ae",
    trn: "100234567800001",
  }).returning())[0];

  await db.insert(schema.purchaseOrders).values({
    tenantId: tenantMadina.id,
    branchId: madinaBarsha.id,
    vendorId: vendor1.id,
    status: "GRN",
    total: "5000.00"
  });

  // 7. Orders
  // To keep it simple, we just create a few orders in Al Barsha
  const getCashierId = await db.query.users.findFirst({
    where: (users, { eq, and }) => and(eq(users.tenantId, tenantMadina.id), eq(users.role, "cashier"))
  });

  const order1 = (await db.insert(schema.orders).values({
    tenantId: tenantMadina.id,
    branchId: madinaBarsha.id,
    cashierId: getCashierId?.id,
    tillId: "Till 1",
    source: "POS",
    subtotal: "40.50",
    vat: "2.02",
    total: "42.52",
    paymentMethod: "Card",
    status: "completed",
  }).returning())[0];

  await db.insert(schema.orderItems).values([
    { orderId: order1.id, productId: madinaProducts[0].id, qty: 2, unitPrice: "2.50" }, // Cola
    { orderId: order1.id, productId: madinaProducts[9].id, qty: 1, unitPrice: "38.50" }, // Rice
  ]);

  const order2 = (await db.insert(schema.orders).values({
    tenantId: tenantMadina.id,
    branchId: madinaBarsha.id,
    tillId: "Aggregator Sync",
    source: "talabat",
    subtotal: "15.00",
    vat: "0.75",
    total: "15.75",
    paymentMethod: "Online",
    status: "auto-synced",
  }).returning())[0];

  await db.insert(schema.orderItems).values([
    { orderId: order2.id, productId: madinaProducts[2].id, qty: 3, unitPrice: "5.00" }, // Bread
  ]);

  const order3 = (await db.insert(schema.orders).values({
    tenantId: tenantMadina.id,
    branchId: madinaBarsha.id,
    cashierId: getCashierId?.id,
    tillId: "Till 2",
    source: "POS",
    subtotal: "32.00",
    vat: "1.60",
    total: "33.60",
    paymentMethod: "Cash",
    status: "refunded",
  }).returning())[0];

  await db.insert(schema.orderItems).values([
    { orderId: order3.id, productId: madinaProducts[4].id, qty: 1, unitPrice: "32.00" }, // Detergent
  ]);

  console.log("Seed script completed successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error("Seed script failed:", e);
  process.exit(1);
});

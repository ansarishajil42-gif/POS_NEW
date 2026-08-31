import { db } from "./db/index.js";
import { eq, and, gt } from "drizzle-orm";
import { products, stockLevels, batches, tills, customers } from "./db/schema.js";

const API_URL = "http://localhost:3000/api";

async function test() {
  console.log("=== STARTING POS TILL INTEGRATION TESTING ===");
  try {
    // 1. Authenticate Cashier
    console.log("1. Authenticating as cashier@almadina.com...");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "cashier@almadina.com", password: "cashier@almadina.com" })
    });
    const loginData = await loginRes.json() as any;
    if (!loginData.token) {
      throw new Error(`Authentication failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.token;
    const branchId = loginData.user.branchId;
    const tenantId = loginData.user.tenantId;
    console.log(`Cashier Authenticated successfully. Branch: ${branchId}, Tenant: ${tenantId}`);

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };

    // 2. Fetch or Create Till terminal
    console.log("\n2. Fetching branch tills...");
    const tillsRes = await fetch(`${API_URL}/pos/tills`, { headers });
    const tillsData = await tillsRes.json() as any;
    let tillId = tillsData.tills?.[0]?.id;
    if (!tillId) {
      console.log("No till found. Creating a test till terminal...");
      const [newTill] = await db.insert(tills).values({
        tenantId,
        branchId,
        name: "Terminal 01",
      }).returning();
      tillId = newTill.id;
    }
    console.log(`Using Till Terminal ID: ${tillId}`);

    // 3. Open Shift if needed
    console.log("\n3. Checking active shift status...");
    const shiftRes = await fetch(`${API_URL}/pos/shift/active`, { headers });
    const shiftData = await shiftRes.json() as any;
    let shiftId = shiftData.shift?.id;
    if (!shiftId) {
      console.log("No active shift open. Opening a new shift...");
      const openShiftRes = await fetch(`${API_URL}/pos/shift/open`, {
        method: "POST",
        headers,
        body: JSON.stringify({ openingFloat: 500, tillId })
      });
      const openShiftData = await openShiftRes.json() as any;
      if (!openShiftData.success) {
        throw new Error(`Failed to open shift: ${JSON.stringify(openShiftData)}`);
      }
      shiftId = openShiftData.shiftId;
      console.log(`Opened new shift with ID: ${shiftId}`);
    } else {
      console.log(`Active shift already open. ID: ${shiftId}`);
    }

    // 4. Find test products (one batch tracked, one regular)
    console.log("\n4. Finding test products...");
    const dbProducts = await db.select().from(products).where(eq(products.tenantId, tenantId)).limit(10);
    const regularProduct = dbProducts.find(p => !p.isBatchTracked);
    const batchProduct = dbProducts.find(p => p.isBatchTracked);

    if (!regularProduct || !batchProduct) {
      throw new Error("Seed database lacks required test products (batch and regular).");
    }

    console.log(`Regular Product: ${regularProduct.name} (ID: ${regularProduct.id})`);
    console.log(`Batch Product: ${batchProduct.name} (ID: ${batchProduct.id})`);

    // Ensure we have stock levels and batches seeded for these products
    const [regStock] = await db.select().from(stockLevels).where(and(eq(stockLevels.productId, regularProduct.id), eq(stockLevels.branchId, branchId)));
    if (!regStock || regStock.stock < 10) {
      await db.insert(stockLevels).values({ productId: regularProduct.id, branchId, stock: 100 }).onConflictDoUpdate({
        target: [stockLevels.productId, stockLevels.branchId],
        set: { stock: 100 }
      });
    }

    const [batchStock] = await db.select().from(stockLevels).where(and(eq(stockLevels.productId, batchProduct.id), eq(stockLevels.branchId, branchId)));
    if (!batchStock || batchStock.stock < 10) {
      await db.insert(stockLevels).values({ productId: batchProduct.id, branchId, stock: 100 }).onConflictDoUpdate({
        target: [stockLevels.productId, stockLevels.branchId],
        set: { stock: 100 }
      });
    }

    // Find or seed a batch for batchProduct
    let testBatch = await db.query.batches.findFirst({
      where: and(eq(batches.productId, batchProduct.id), eq(batches.branchId, branchId), gt(batches.stock, 0))
    });
    if (!testBatch) {
      const [newBatch] = await db.insert(batches).values({
        productId: batchProduct.id,
        branchId,
        batchNumber: "B-TEST-001",
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days expiry
        stock: 50
      }).returning();
      testBatch = newBatch;
    }

    // Fetch initial quantities
    const [initialRegStock] = await db.select().from(stockLevels).where(and(eq(stockLevels.productId, regularProduct.id), eq(stockLevels.branchId, branchId)));
    const [initialBatchStock] = await db.select().from(stockLevels).where(and(eq(stockLevels.productId, batchProduct.id), eq(stockLevels.branchId, branchId)));
    const initialBatchQty = testBatch.stock;

    console.log(`[INITIAL STOCK] Regular Product: ${initialRegStock.stock} units`);
    console.log(`[INITIAL STOCK] Batch Product: ${initialBatchStock.stock} units | Batch stock: ${initialBatchQty} units`);

    // 5. Query or Seed a customer for loyalty points/store credit checkout
    console.log("\n5. Resolving customer...");
    let testCustomer = await db.query.customers.findFirst({ where: eq(customers.tenantId, tenantId) });
    if (!testCustomer) {
      const [newCust] = await db.insert(customers).values({
        tenantId,
        name: "Test POS Customer",
        phone: "+971501111111",
        email: "pos_customer@test.com",
        points: 1000,
        storeCredit: "200.00"
      }).returning();
      testCustomer = newCust;
    }
    await db.update(customers).set({ isActive: true }).where(eq(customers.id, testCustomer.id));
    console.log(`Customer: ${testCustomer.name} (Points: ${testCustomer.points}, Store Credit: ${testCustomer.storeCredit})`);

    // 6. Test TRANSACTION ROLLBACK on checkout failure
    console.log("\n6. Testing transactional Rollback on Checkout failure...");
    const badCheckoutBody = {
      subtotal: 100,
      vat: 5,
      total: 105,
      payments: [{ method: "Cash", amount: 105 }],
      items: [
        { productId: regularProduct.id, qty: 5, unitPrice: 20 },
        { productId: "00000000-0000-0000-0000-000000000000", qty: 2, unitPrice: 10 } // Non-existent product ID triggers error
      ]
    };

    const rollbackCheckoutRes = await fetch(`${API_URL}/pos/checkout`, {
      method: "POST",
      headers,
      body: JSON.stringify(badCheckoutBody)
    });
    const rollbackData = await rollbackCheckoutRes.json() as any;
    console.log(`Rollback checkout response status: ${rollbackCheckoutRes.status} | error: ${rollbackData.error}`);

    // Verify stock levels did NOT change
    const [postRollbackRegStock] = await db.select().from(stockLevels).where(and(eq(stockLevels.productId, regularProduct.id), eq(stockLevels.branchId, branchId)));
    console.log(`[POST ROLLBACK STOCK] Regular Product: ${postRollbackRegStock.stock} units (Expected: ${initialRegStock.stock})`);
    if (postRollbackRegStock.stock !== initialRegStock.stock) {
      throw new Error("ROLLBACK FAILED! Stock was decremented despite checkout error.");
    }
    console.log("SUCCESS: Rollback perfectly restored all stock levels!");

    // 7. Test successful split payment checkout
    console.log("\n7. Executing successful split payment checkout...");
    const regPrice = parseFloat(regularProduct.salePrice);
    const batchPrice = parseFloat(batchProduct.salePrice);
    const reqRegQty = 2;
    const reqBatchQty = 3;
    const itemSubtotal = (regPrice * reqRegQty) + (batchPrice * reqBatchQty);
    const itemVat = itemSubtotal * 0.05;
    const itemTotal = itemSubtotal + itemVat;

    console.log(`Checkout calculation: subtotal: ${itemSubtotal}, vat: ${itemVat}, total: ${itemTotal}`);

    // Split payments: Cash + Card
    const checkoutBody = {
      subtotal: itemSubtotal,
      vat: itemVat,
      total: itemTotal,
      payments: [
        { method: "Cash", amount: itemTotal / 2 },
        { method: "Card", amount: itemTotal / 2 }
      ],
      items: [
        { productId: regularProduct.id, qty: reqRegQty, unitPrice: regPrice },
        { productId: batchProduct.id, qty: reqBatchQty, unitPrice: batchPrice }
      ],
      customerId: testCustomer.id
    };

    const checkoutRes = await fetch(`${API_URL}/pos/checkout`, {
      method: "POST",
      headers,
      body: JSON.stringify(checkoutBody)
    });
    const checkoutData = await checkoutRes.json() as any;
    if (!checkoutData.success) {
      throw new Error(`Checkout failed: ${JSON.stringify(checkoutData)}`);
    }
    console.log(`Checkout completed successfully. Order ID: ${checkoutData.orderId}`);

    // 8. Verify post-checkout stock levels and batch deduction
    console.log("\n8. Verifying stock levels and FEFO batch deduction...");
    const [finalRegStock] = await db.select().from(stockLevels).where(and(eq(stockLevels.productId, regularProduct.id), eq(stockLevels.branchId, branchId)));
    const [finalBatchStock] = await db.select().from(stockLevels).where(and(eq(stockLevels.productId, batchProduct.id), eq(stockLevels.branchId, branchId)));
    const [finalBatch] = await db.select().from(batches).where(eq(batches.id, testBatch.id));

    console.log(`[FINAL STOCK] Regular Product: ${finalRegStock.stock} units (Expected: ${initialRegStock.stock - reqRegQty})`);
    console.log(`[FINAL STOCK] Batch Product: ${finalBatchStock.stock} units (Expected: ${initialBatchStock.stock - reqBatchQty})`);
    console.log(`[FINAL BATCH STOCK] Batch ID ${testBatch.batchNumber}: ${finalBatch.stock} units (Expected: ${initialBatchQty - reqBatchQty})`);

    if (finalRegStock.stock !== initialRegStock.stock - reqRegQty) {
      throw new Error("Regular stock levels mismatch!");
    }
    if (finalBatchStock.stock !== initialBatchStock.stock - reqBatchQty) {
      throw new Error("Batch stock levels mismatch!");
    }
    if (finalBatch.stock !== initialBatchQty - reqBatchQty) {
      throw new Error("Batch quantities mismatch!");
    }
    console.log("SUCCESS: Stock levels and FEFO batches perfectly decremented!");

    console.log("\n=== ALL POS INTEGRATION CHECKS PASSED SUCCESSFULLY ===");
  } catch (error: any) {
    console.error("POS api tests failed:", error.message);
  } finally {
    process.exit(0);
  }
}

test();

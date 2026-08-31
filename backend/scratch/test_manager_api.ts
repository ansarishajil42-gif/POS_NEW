import { db } from "../src/db/index.js";
import { shifts, staffUsers, tills } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

const API_URL = "http://localhost:3000/api";

async function test() {
  console.log("=== STARTING EXTENDED STORE MANAGER API VERIFICATION ===");
  try {
    // 1. Authenticate as branch manager
    console.log("1. Authenticating as manager@almadina.com...");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "manager@almadina.com",
        password: "manager@almadina.com"
      })
    });
    const loginData = await loginRes.json() as any;
    const token = loginData.token;
    console.log("Token received:", token.slice(0, 15) + "...");

    const headers = { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    };

    // 2. Fetch Store Manager Data
    console.log("\n2. Calling GET /store-manager/data...");
    const dataRes = await fetch(`${API_URL}/store-manager/data`, { headers });
    const data = await dataRes.json() as any;
    console.log("Branch Info:", data.branch?.name);
    console.log("Stock levels count:", data.stock?.length);
    console.log("Tills count:", data.tills?.length);

    // 3. Adjust Stock
    const firstProduct = data.stock?.[0];
    if (firstProduct) {
      console.log(`\n3. Adjusting stock for product: ${firstProduct.productName} (ID: ${firstProduct.productId})...`);
      const adjustRes = await fetch(`${API_URL}/store-manager/stock/adjust`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          productId: firstProduct.productId,
          quantityChange: 15,
          reason: "Correction",
          note: "API verification script audit"
        })
      });
      const adjustData = await adjustRes.json();
      console.log("Stock adjustment result:", adjustData);

      // Verify stock adjustment history
      console.log("\n4. Calling GET /store-manager/stock/adjust/history...");
      const historyRes = await fetch(`${API_URL}/store-manager/stock/adjust/history`, { headers });
      const historyData = await historyRes.json() as any[];
      console.log("Latest history entry:", historyData[0]);
    }

    // 4. Create Till
    console.log("\n5. Creating a new Till...");
    const tillName = "Till " + Math.floor(Math.random() * 1000);
    const tillRes = await fetch(`${API_URL}/store-manager/tills`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: tillName,
        description: "Mobile API test till",
        openingFloat: 350.00
      })
    });
    const tillData = await tillRes.json();
    console.log("Create Till result:", tillData);

    // 5. Insert an Open Shift using Drizzle for mathematical testing
    console.log("\n6. Creating an active Open Shift in database...");
    const [cashier] = await db
      .select({ id: staffUsers.id })
      .from(staffUsers)
      .where(eq(staffUsers.email, "cashier@almadina.com"));

    const [tillItem] = await db
      .select({ id: tills.id })
      .from(tills)
      .where(eq(tills.branchId, data.branch.id));

    // Delete any old open shift for this cashier first to avoid constraints
    await db.delete(shifts).where(eq(shifts.cashierId, cashier.id));

    const [testShift] = await db.insert(shifts).values({
      tenantId: data.branch.tenantId,
      branchId: data.branch.id,
      cashierId: cashier.id,
      tillId: tillItem.id,
      openedAt: new Date(),
      openingFloat: "200.00",
      cashDrops: "[]",
      status: "Open"
    }).returning();
    console.log(`Open Shift created with ID: ${testShift.id}, Opening Float: AED 200.00`);

    // 6. Test Cash Drop
    console.log(`\n7. Recording Cash Drop on shift: ${testShift.id}...`);
    const dropRes = await fetch(`${API_URL}/store-manager/shifts/${testShift.id}/cash-drop`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amount: 150.00,
        note: "Manager mid-day drop"
      })
    });
    const dropData = await dropRes.json();
    console.log("Cash drop result:", dropData);

    // 7. Test Close Shift
    console.log(`\n8. Closing shift: ${testShift.id} with actual Cash: AED 500.00...`);
    const closeRes = await fetch(`${API_URL}/store-manager/shifts/${testShift.id}/close`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        actualCash: 500.00
      })
    });
    const closeData = await closeRes.json();
    console.log("Close shift final receipt:", JSON.stringify(closeData, null, 2));

    console.log("\n=== ALL EXTENDED STORE MANAGER API TESTS COMPLETED SUCCESSFULLY ===");
  } catch (error: any) {
    console.error("Test failed:", error.message);
  } finally {
    process.exit(0);
  }
}

test();

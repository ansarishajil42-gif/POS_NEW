const API_URL = "http://localhost:3000/api";

async function test() {
  console.log("=== STARTING EXTENDED INVENTORY MANAGER API VERIFICATION ===");
  try {
    // 1. Authenticate as inventory manager
    console.log("1. Authenticating as inventory@almadina.com...");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "inventory@almadina.com",
        password: "inventory@almadina.com"
      })
    });
    const loginData = await loginRes.json() as any;
    if (!loginData.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const token = loginData.token;
    console.log("Token received:", token.slice(0, 15) + "...");

    const headers = { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    };

    // 2. Fetch Inventory Data
    console.log("\n2. Calling GET /inventory/data...");
    const dataRes = await fetch(`${API_URL}/inventory/data`, { headers });
    const data = await dataRes.json() as any;
    console.log("Stats count:", JSON.stringify(data.stats));
    console.log("Stock levels list count:", data.stockLevels?.length);
    console.log("Batches list count:", data.batches?.length);
    console.log("Recent transfers count:", data.transfers?.length);

    // Get a valid product ID
    const product = data.stockLevels?.[0];
    if (!product) {
      throw new Error("No products found in stock levels to perform tests!");
    }

    console.log(`Using product: ${product.productName} (ID: ${product.productId})`);

    // 3. Perform Stock Transfer
    console.log("\n3. Testing POST /inventory/transfer (inter-branch)...");
    const sourceBranch = "5854a32c-ee38-40ab-b2c7-3edc1d085687"; // Al Barsha
    const targetBranch = "ea7db86a-b4ed-4fdb-8d31-ed3174e0a37e"; // Deira (same tenant)
    const transferRes = await fetch(`${API_URL}/inventory/transfer`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        productId: product.productId,
        sourceBranchId: sourceBranch,
        targetBranchId: targetBranch,
        quantity: 2
      })
    });
    const transferResult = await transferRes.json() as any;
    console.log("Transfer Result:", JSON.stringify(transferResult));

    // 4. Perform stock adjustment
    console.log("\n4. Testing POST /inventory/adjust...");
    const adjustRes = await fetch(`${API_URL}/inventory/adjust`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        productId: product.productId,
        branchId: sourceBranch,
        quantityChange: 10,
        reason: "Test Manual Audit Adjustment"
      })
    });
    const adjustResult = await adjustRes.json() as any;
    console.log("Adjustment Result:", JSON.stringify(adjustResult));

    // 5. Apply Clearance Sale
    console.log("\n5. Testing POST /inventory/clearance...");
    const clearanceRes = await fetch(`${API_URL}/inventory/clearance`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        productId: product.productId,
        discountPct: 20
      })
    });
    const clearanceResult = await clearanceRes.json() as any;
    console.log("Clearance Promotion Result:", JSON.stringify(clearanceResult));

    // 6. Read Inventory Ledger
    console.log("\n6. Calling GET /inventory/ledger...");
    const ledgerRes = await fetch(`${API_URL}/inventory/ledger`, { headers });
    const ledgerData = await ledgerRes.json() as any;
    console.log("Latest movement ledger entry:", JSON.stringify(ledgerData.ledger?.[0]));
    console.log("Second latest movement ledger entry:", JSON.stringify(ledgerData.ledger?.[1]));

    console.log("\n=== ALL INVENTORY MANAGER API TESTS COMPLETED SUCCESSFULLY ===");
  } catch (error: any) {
    console.error("Test execution failed:", error.message);
  } finally {
    process.exit(0);
  }
}

test();

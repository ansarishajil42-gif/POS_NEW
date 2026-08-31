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
    console.log("Token received successfully.");

    const headers = { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    };

    // 2. Fetch Initial Inventory Data
    console.log("\n2. Fetching initial stock levels...");
    const dataRes = await fetch(`${API_URL}/inventory/data`, { headers });
    const data = await dataRes.json() as any;
    
    // Get a valid product ID
    const product = data.stockLevels?.[0];
    if (!product) {
      throw new Error("No products found in stock levels to perform tests!");
    }
    const productId = product.productId;
    const sourceBranch = "5854a32c-ee38-40ab-b2c7-3edc1d085687"; // Al Barsha
    const targetBranch = "ea7db86a-b4ed-4fdb-8d31-ed3174e0a37e"; // Deira

    // Find initial stock levels for this product at both branches
    const initialSourceStock = data.stockLevels.find((s: any) => s.productId === productId && s.branchId === sourceBranch)?.stock || 0;
    const initialTargetStock = data.stockLevels.find((s: any) => s.productId === productId && s.branchId === targetBranch)?.stock || 0;

    console.log(`Product: ${product.productName} (ID: ${productId})`);
    console.log(`[INITIAL STOCKS] Source: ${initialSourceStock} units | Destination: ${initialTargetStock} units`);

    // 3. Perform Stock Transfer (5 units)
    const transferQty = 5;
    console.log(`\n3. Initiating transfer of ${transferQty} units from Source to Destination...`);
    const transferRes = await fetch(`${API_URL}/inventory/transfer`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        productId,
        sourceBranchId: sourceBranch,
        targetBranchId: targetBranch,
        quantity: transferQty
      })
    });
    const transferResult = await transferRes.json() as any;
    console.log("Transfer response status:", transferRes.status, JSON.stringify(transferResult));

    // Fetch new stock levels to confirm transfer completed
    const dataRes2 = await fetch(`${API_URL}/inventory/data`, { headers });
    const data2 = await dataRes2.json() as any;
    const afterTransferSourceStock = data2.stockLevels.find((s: any) => s.productId === productId && s.branchId === sourceBranch)?.stock || 0;
    const afterTransferTargetStock = data2.stockLevels.find((s: any) => s.productId === productId && s.branchId === targetBranch)?.stock || 0;
    console.log(`[AFTER TRANSFER STOCKS] Source: ${afterTransferSourceStock} units | Destination: ${afterTransferTargetStock} units`);

    // Get the transfer ID
    const recentTransfer = data2.transfers?.[0];
    if (!recentTransfer) {
      throw new Error("Created transfer not found in recent transfers list!");
    }
    const transferId = recentTransfer.id || recentTransfer.transferId;
    console.log(`Created Transfer Record ID: ${transferId} (Status: ${recentTransfer.status})`);

    // 4. Test Edit Rejection on Completed Transfer
    console.log("\n4. Testing Edit (PATCH) on Completed Stock Transfer (Expected to fail)...");
    const editRes = await fetch(`${API_URL}/inventory/transfer/${transferId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ quantity: 10 })
    });
    const editResult = await editRes.json() as any;
    console.log(`Edit Response (Status ${editRes.status}):`, JSON.stringify(editResult));
    if (editRes.status === 400 && editResult.error) {
      console.log("SUCCESS: Edit request on Completed transfer was correctly rejected!");
    } else {
      throw new Error("FAIL: Completed stock transfer edit request was not rejected!");
    }

    // 5. Test Delete with Safety Reversal Rollback
    console.log("\n5. Testing Delete with Rollback on Completed Stock Transfer...");
    const deleteRes = await fetch(`${API_URL}/inventory/transfer/${transferId}`, {
      method: "DELETE",
      headers
    });
    const deleteResult = await deleteRes.json() as any;
    console.log(`Delete Response (Status ${deleteRes.status}):`, JSON.stringify(deleteResult));

    // 6. Fetch Final Stocks to Verify Reversal
    console.log("\n6. Fetching final stock levels post-deletion...");
    const dataRes3 = await fetch(`${API_URL}/inventory/data`, { headers });
    const data3 = await dataRes3.json() as any;
    const finalSourceStock = data3.stockLevels.find((s: any) => s.productId === productId && s.branchId === sourceBranch)?.stock || 0;
    const finalTargetStock = data3.stockLevels.find((s: any) => s.productId === productId && s.branchId === targetBranch)?.stock || 0;
    console.log(`[FINAL POST-ROLLBACK STOCKS] Source: ${finalSourceStock} units | Destination: ${finalTargetStock} units`);

    if (finalSourceStock === initialSourceStock && finalTargetStock === initialTargetStock) {
      console.log("\nSUCCESS: Stock levels were perfectly rolled back to their original state!");
    } else {
      throw new Error(`FAIL: Rollback numbers mismatch! Expected Source:${initialSourceStock}/Target:${initialTargetStock}, got Source:${finalSourceStock}/Target:${finalTargetStock}`);
    }

    console.log("\n=== ALL INVENTORY MANAGER API TESTS COMPLETED SUCCESSFULLY ===");
  } catch (error: any) {
    console.error("Test execution failed:", error.message);
  } finally {
    process.exit(0);
  }
}

test();

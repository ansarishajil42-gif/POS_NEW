const API_URL = "http://localhost:3000/api";

async function test() {
  console.log("=== STARTING PURCHASING OFFICER API VERIFICATION ===");
  try {
    // 1. Authenticate as Purchasing Officer
    console.log("1. Authenticating as purchasing@almadina.com...");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "purchasing@almadina.com",
        password: "purchasing@almadina.com"
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

    // 2. Fetch POs
    console.log("\n2. Calling GET /purchasing/pos...");
    const posRes = await fetch(`${API_URL}/purchasing/pos`, { headers });
    const pos = await posRes.json() as any;
    console.log(`PO Count fetched: ${pos.length}`);
    if (pos.length > 0) {
      console.log("Latest PO Item sample:", JSON.stringify({
        id: pos[0].id,
        status: pos[0].status,
        total: pos[0].total,
        vendorName: pos[0].vendor?.name
      }));
    }

    // 3. Fetch GRNs
    console.log("\n3. Calling GET /purchasing/grns...");
    const grnsRes = await fetch(`${API_URL}/purchasing/grns`, { headers });
    const grns = await grnsRes.json() as any;
    console.log(`GRN Count fetched: ${grns.length}`);
    if (grns.length > 0) {
      console.log("Latest GRN sample:", JSON.stringify({
        id: grns[0].id,
        grnNumber: grns[0].grnNumber,
        status: grns[0].status,
        vendorName: grns[0].vendor?.name
      }));
    }

    console.log("\n=== PURCHASING OFFICER API VERIFICATION SUCCESSFUL ===");
  } catch (error: any) {
    console.error("Test execution failed:", error.message);
  } finally {
    process.exit(0);
  }
}

test();

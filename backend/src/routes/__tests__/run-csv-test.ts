import {
  generateSingleFileCsvPayload,
  encryptSecret,
  decryptSecret,
  formatTimestamp,
  ProductItemInput,
  connectionsStore,
  runScheduledSyncEngine,
  syncLogsStore,
} from "../aggregator-sftp.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log("\n🧪 Running Phase 1, 2 & 3 Aggregator SFTP Test Suite...\n");

  // Test 1: Encryption & Decryption
  const rawPass = "dummy123_secret";
  const encrypted = encryptSecret(rawPass);
  assert(encrypted !== rawPass, "Password is encrypted and not plaintext");
  assert(encrypted.includes(":"), "Encrypted password contains IV and AuthTag delimiters");
  const decrypted = decryptSecret(encrypted);
  assert(decrypted === rawPass, "Encrypted password decrypts back cleanly to original value");

  // Test 2: Barcode vs SKU Mutual Exclusivity
  const itemsExcl: ProductItemInput[] = [
    { id: "1", barcode: "6291001002011", sku: "IGNORED_SKU", price: "10.00", active: true },
    { id: "2", barcode: "", sku: "SKU-TEA-100", price: "20.00", active: true },
  ];
  const resExcl = generateSingleFileCsvPayload("test_vendor", "price_discounted", itemsExcl);
  const linesExcl = resExcl.csvContent.split("\n");
  const row1Excl = linesExcl[1].split(",");
  assert(row1Excl[0] === "6291001002011" && row1Excl[1] === "", "Product with barcode has empty sku column");
  const row2Excl = linesExcl[2].split(",");
  assert(row2Excl[0] === "" && row2Excl[1] === "SKU-TEA-100", "Product with sku has empty barcode column");

  // Test 3: Promotion Fields Block Rule & Competitiveness String
  const now = new Date("2026-09-02T10:00:00Z");
  const future = new Date("2026-09-16T10:00:00Z");
  const itemsPromo: ProductItemInput[] = [
    {
      id: "1",
      barcode: "6291001002011",
      price: "15.00",
      active: true,
      promotion: {
        startDate: now,
        endDate: future,
        discountedPrice: "12.00",
        maxNoOfOrders: "100",
      },
    },
    {
      id: "2",
      sku: "SKU-NO-PROMO",
      price: "25.00",
      active: true,
      promotion: null,
    },
  ];
  const resPromo = generateSingleFileCsvPayload("test_vendor", "price_discounted", itemsPromo);
  const linesPromo = resPromo.csvContent.split("\n");
  const row1Promo = linesPromo[1].split(",");
  assert(row1Promo[4] === "competitiveness", "Active promotion contains fixed string 'competitiveness'");
  assert(row1Promo[5] === formatTimestamp(now), "Start date is formatted as YYYY-MM-DD HH:MM:SS");
  assert(row1Promo[6] === formatTimestamp(future), "End date is formatted as YYYY-MM-DD HH:MM:SS");
  assert(row1Promo[7] === "1", "Campaign status is 1");
  assert(row1Promo[8] === "12.00", "Discounted price is 12.00");
  assert(row1Promo[9] === "100", "Max no of orders is 100");

  const row2Promo = linesPromo[2].split(",");
  assert(
    row2Promo[4] === "" &&
    row2Promo[5] === "" &&
    row2Promo[6] === "" &&
    row2Promo[7] === "" &&
    row2Promo[8] === "" &&
    row2Promo[9] === "",
    "Product without active promotion has ALL promotion fields left completely blank"
  );

  // Test 4: Price Format Flexibility
  const resPriceA = generateSingleFileCsvPayload("test_vendor", "price_discounted", itemsExcl);
  assert(resPriceA.csvContent.startsWith("barcode,sku,price,active,reason,start_date,end_date,campaign_status,discounted_price,max_no_of_orders"), "price_discounted header format");

  const resPriceB = generateSingleFileCsvPayload("test_vendor", "original_discounted", itemsExcl);
  assert(resPriceB.csvContent.startsWith("barcode,sku,original_price,active,reason,start_date,end_date,campaign_status,discounted_price,max_no_of_orders"), "original_discounted header format");

  const resPriceC = generateSingleFileCsvPayload("test_vendor", "original_price", itemsExcl);
  assert(resPriceC.csvContent.startsWith("barcode,sku,original_price,active,reason,start_date,end_date,campaign_status,price,max_no_of_orders"), "original_price header format");

  // Test 5: Duplicate Product Overlap Handling (Keep Bottom Row)
  const itemsDup: ProductItemInput[] = [
    { id: "1", barcode: "6291001002011", price: "10.00", active: true },
    { id: "1", barcode: "6291001002011", price: "12.50", active: true },
  ];
  const resDup = generateSingleFileCsvPayload("test_vendor", "price_discounted", itemsDup);
  const linesDup = resDup.csvContent.split("\n");
  assert(linesDup.length === 2, "Duplicate product rows are deduplicated");
  assert(linesDup[1].split(",")[2] === "12.50", "Deduplication keeps the bottom row");

  // --- PHASE 3 AUTOMATION & SCHEDULER TESTS ---
  console.log("\n🧪 Running Phase 3 Scheduler & Safeguard Tests...\n");

  // Check 1: Existing dummy connection sync_frequency remains "manual"
  const defaultConn = connectionsStore.get("conn_dummy_talabat");
  assert(defaultConn?.syncFrequency === "manual", "Existing test connection sync_frequency was NOT changed from 'manual'");

  // Check 2: Setup a scheduled test connection with invalid host to test 3-consecutive-failures auto-deactivation
  const schedId = "conn_sched_test_failing";
  connectionsStore.set(schedId, {
    id: schedId,
    tenantId: "default-tenant",
    branchId: "branch_sub",
    aggregatorName: "talabat",
    sftpHost: "invalid.test.local", // Will trigger simulated failure
    sftpPort: 22,
    sftpUsername: "failing_vendor",
    sftpPasswordEncrypted: encryptSecret("pass"),
    remoteDirectory: "/Assortment",
    vendorId: "failing_vendor",
    priceFormat: "price_discounted",
    syncFrequency: "15min",
    isPaused: false,
    consecutiveFailures: 0,
    isActive: true, // Started active
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Run 1
  await runScheduledSyncEngine(true);
  const connAfterRun1 = connectionsStore.get(schedId);
  assert(connAfterRun1?.consecutiveFailures === 1, "Consecutive failure count incremented to 1 after run 1");
  assert(connAfterRun1?.isActive === true, "Connection remains active after 1 failure");

  // Run 2
  await runScheduledSyncEngine(true);
  const connAfterRun2 = connectionsStore.get(schedId);
  assert(connAfterRun2?.consecutiveFailures === 2, "Consecutive failure count incremented to 2 after run 2");
  assert(connAfterRun2?.isActive === true, "Connection remains active after 2 failures");

  // Run 3
  await runScheduledSyncEngine(true);
  const connAfterRun3 = connectionsStore.get(schedId);
  assert(connAfterRun3?.consecutiveFailures === 3, "Consecutive failure count reached 3 after run 3");
  assert(connAfterRun3?.isActive === false, "Connection auto-deactivated (is_active = false) after 3 consecutive failures");

  const latestLog = syncLogsStore.find((l) => l.aggregatorConnectionId === schedId);
  assert(
    latestLog?.errorMessage?.includes("Auto-deactivated: 3 consecutive scheduled SFTP sync failures") ?? false,
    "Audit log contains auto-deactivation reason"
  );

  console.log("\n🎉 ALL PHASE 1, 2 & 3 TESTS PASSED SUCCESSFULLY!\n");
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});

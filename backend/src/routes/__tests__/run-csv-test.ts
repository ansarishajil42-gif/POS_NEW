import {
  generateSingleFileCsvPayload,
  encryptSecret,
  decryptSecret,
  formatTimestamp,
  ProductItemInput,
} from "../aggregator-sftp.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log("\n🧪 Running Phase 1 Aggregator SFTP Test Suite...\n");

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

console.log("\n🎉 ALL PHASE 1 TESTS PASSED SUCCESSFULLY!\n");

import {
  generateSingleFileCsvPayload,
  encryptSecret,
  decryptSecret,
  ProductItemInput,
} from "../aggregator-sftp.js";
import { formatTimestamp } from "../../aggregator-adapters/index.js";

describe("Phase 1 - Aggregator SFTP CSV Generator & Encryption Unit Tests", () => {

  test("1. AES-256-GCM Encryption & Decryption", () => {
    const rawPassword = "dummy123_secret_password";
    const encrypted = encryptSecret(rawPassword);

    expect(encrypted).not.toBe(rawPassword);
    expect(encrypted).toContain(":"); // Format: iv:authTag:encrypted

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(rawPassword);
  });

  test("2. Barcode vs SKU Mutual Exclusivity", () => {
    const items: ProductItemInput[] = [
      { id: "1", barcode: "6291001002011", sku: "IGNORED_SKU", price: "10.00", active: true },
      { id: "2", barcode: "", sku: "SKU-TEA-100", price: "20.00", active: true },
    ];

    const result = generateSingleFileCsvPayload("test_vendor", "price_discounted", items);
    const lines = result.csvContent.split("\n");

    // Line 1: Header (barcode,sku,price,active,reason,start_date,end_date,campaign_status,discounted_price,max_no_of_orders)
    // Line 2: Product 1 -> barcode populated, sku MUST BE EMPTY
    const row1 = lines[1].split(",");
    expect(row1[0]).toBe("6291001002011");
    expect(row1[1]).toBe("");

    // Line 3: Product 2 -> barcode empty, sku MUST BE POPULATED
    const row2 = lines[2].split(",");
    expect(row2[0]).toBe("");
    expect(row2[1]).toBe("SKU-TEA-100");
  });

  test("3. Promotion Fields Block Rule & Competitiveness String", () => {
    const now = new Date("2026-09-02T10:00:00Z");
    const future = new Date("2026-09-16T10:00:00Z");

    const items: ProductItemInput[] = [
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

    const result = generateSingleFileCsvPayload("test_vendor", "price_discounted", items);
    const lines = result.csvContent.split("\n");

    // Line 2: Product 1 with Promo
    const row1 = lines[1].split(",");
    expect(row1[4]).toBe("competitiveness"); // reason
    expect(row1[5]).toBe(formatTimestamp(now)); // start_date format YYYY-MM-DD HH:MM:SS
    expect(row1[6]).toBe(formatTimestamp(future)); // end_date format YYYY-MM-DD HH:MM:SS
    expect(row1[7]).toBe("1"); // campaign_status
    expect(row1[8]).toBe("12.00"); // discounted_price
    expect(row1[9]).toBe("100"); // max_no_of_orders

    // Line 3: Product 2 without Promo (ALL promo fields MUST be blank)
    const row2 = lines[2].split(",");
    expect(row2[4]).toBe("");
    expect(row2[5]).toBe("");
    expect(row2[6]).toBe("");
    expect(row2[7]).toBe("");
    expect(row2[8]).toBe("");
    expect(row2[9]).toBe("");
  });

  test("4. Price Format Flexibility Options", () => {
    const items: ProductItemInput[] = [
      { id: "1", barcode: "6291001002011", price: "10.00", active: true },
    ];

    // Option A: price_discounted
    const resA = generateSingleFileCsvPayload("test_vendor", "price_discounted", items);
    expect(resA.csvContent.startsWith("barcode,sku,price,active,reason,start_date,end_date,campaign_status,discounted_price,max_no_of_orders")).toBe(true);

    // Option B: original_discounted
    const resB = generateSingleFileCsvPayload("test_vendor", "original_discounted", items);
    expect(resB.csvContent.startsWith("barcode,sku,original_price,active,reason,start_date,end_date,campaign_status,discounted_price,max_no_of_orders")).toBe(true);

    // Option C: original_price
    const resC = generateSingleFileCsvPayload("test_vendor", "original_price", items);
    expect(resC.csvContent.startsWith("barcode,sku,original_price,active,reason,start_date,end_date,campaign_status,price,max_no_of_orders")).toBe(true);
  });

  test("5. Duplicate Product Overlap Handling (Keep Later/Bottom Row)", () => {
    const items: ProductItemInput[] = [
      { id: "1", barcode: "6291001002011", price: "10.00", active: true },
      { id: "1", barcode: "6291001002011", price: "12.50", active: true }, // Updated price in bottom row
    ];

    const result = generateSingleFileCsvPayload("test_vendor", "price_discounted", items);
    const lines = result.csvContent.split("\n");

    expect(lines.length).toBe(2); // Header + 1 deduplicated row
    const row = lines[1].split(",");
    expect(row[2]).toBe("12.50"); // Kept bottom row price
  });
});

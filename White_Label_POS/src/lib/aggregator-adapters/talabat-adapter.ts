import { AggregatorAdapter, ProductData, ConnectionConfigAdapter, GeneratedFileResult } from "./types.js";

/**
 * Format Date to exact YYYY-MM-DD HH:MM:SS
 */
export function formatTimestamp(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const talabatAdapter: AggregatorAdapter = {
  aggregatorName: "talabat",

  generateFile(products: ProductData[], connection: ConnectionConfigAdapter): GeneratedFileResult {
    // Deduplication & field mapping: Keep bottom row for duplicate items
    const uniqueItemsMap = new Map<string, { sku: string; price: string; active: string }>();

    for (const p of products) {
      // Rule 2: sku = product barcode (keep leading zeros). If barcode empty -> use product.sku. If both empty -> SKIP.
      const barcode = p.barcode != null ? String(p.barcode).trim() : "";
      const sku = p.sku != null ? String(p.sku).trim() : "";
      const resolvedSku = barcode || sku;

      if (!resolvedSku) {
        continue;
      }

      // Rule 3: price = the Talabat price, max 2 decimals
      const rawPrice = parseFloat(String(p.price ?? "0"));
      const priceNum = isNaN(rawPrice) ? 0 : Number(rawPrice.toFixed(2));
      const formattedPrice = String(priceNum);

      // Rule 4: active = 1 if stock > 0, else 0
      const activeVal = p.active ? "1" : "0";

      // Rule 5: No duplicate sku rows
      uniqueItemsMap.set(resolvedSku, {
        sku: resolvedSku,
        price: formattedPrice,
        active: activeVal,
      });
    }

    // Rule 1 & 5: Exactly 3 columns in this order: sku, price, active. Header line exactly sku,price,active
    const rows: string[] = ["sku,price,active"];
    for (const item of uniqueItemsMap.values()) {
      rows.push(`${item.sku},${item.price},${item.active}`);
    }

    const cleanVendorId = (connection.storeVendorId || connection.vendorId || "vendor_id").trim();
    const prefix =
      (connection.filenamePrefix || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, "") || "assortment";
    const fileName = `${prefix}_${cleanVendorId}.csv`;

    return {
      fileName,
      fileContent: rows.join("\n"),
      recordCount: uniqueItemsMap.size,
    };
  },
};

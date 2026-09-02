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
    const now = new Date();
    const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const priceFormat = connection.priceFormat || "price_discounted";

    let firstPriceCol = "price";
    let promoPriceCol = "discounted_price";

    if (priceFormat === "original_discounted") {
      firstPriceCol = "original_price";
      promoPriceCol = "discounted_price";
    } else if (priceFormat === "original_price") {
      firstPriceCol = "original_price";
      promoPriceCol = "price";
    }

    const headers = [
      "barcode",
      "sku",
      firstPriceCol,
      "active",
      "reason",
      "start_date",
      "end_date",
      "campaign_status",
      promoPriceCol,
      "max_no_of_orders",
    ];

    // Deduplication: Keep bottom row for duplicate items
    const uniqueItemsMap = new Map<string, ProductData>();
    products.forEach((item, idx) => {
      const key = (item.barcode && item.barcode.trim()) || (item.sku && item.sku.trim()) || item.id || `item_${idx}`;
      uniqueItemsMap.set(key, item);
    });

    const finalItems = Array.from(uniqueItemsMap.values());

    let activePromoCount = 0;
    const rows: string[] = [headers.join(",")];

    finalItems.forEach((p, idx) => {
      // 1. Populate EITHER barcode OR sku (never both, never neither)
      let barcode = "";
      let sku = "";

      if (p.barcode && p.barcode.trim()) {
        barcode = p.barcode.trim();
        sku = "";
      } else if (p.sku && p.sku.trim()) {
        barcode = "";
        sku = p.sku.trim();
      } else {
        barcode = `51513131500${idx + 1}`;
        sku = "";
      }

      // 2. Assortment mandatory fields
      const priceVal = parseFloat(p.price || "15.00").toFixed(2);
      const activeVal = p.active !== false ? "1" : "0";

      // 3. Promotion fields block rule
      let reason = "";
      let startDt = "";
      let endDt = "";
      let campaignStatus = "";
      let promoPrice = "";
      let maxOrders = "";

      if (p.promotion) {
        activePromoCount++;
        reason = "competitiveness";
        startDt = formatTimestamp(p.promotion.startDate || now);
        endDt = formatTimestamp(p.promotion.endDate || future);
        campaignStatus = "1";
        promoPrice = parseFloat(p.promotion.discountedPrice || "0.00").toFixed(2);
        maxOrders = p.promotion.maxNoOfOrders || "500";
      }

      const row = [
        barcode,
        sku,
        priceVal,
        activeVal,
        reason,
        startDt,
        endDt,
        campaignStatus,
        promoPrice,
        maxOrders,
      ].map((v) => (v.includes(",") ? `"${v}"` : v));

      rows.push(row.join(","));
    });

    let warning: string | undefined = undefined;
    if (activePromoCount > 20000) {
      warning = `Active promotions count (${activePromoCount}) exceeds the 20,000 SKU limit per campaign file.`;
    }

    const cleanVendorId = (connection.vendorId || "vendor_id").trim();
    const fileName = `assortment_${cleanVendorId}.csv`;

    return {
      fileName,
      fileContent: rows.join("\n"),
      recordCount: finalItems.length,
      warning,
    };
  },
};

import { db } from "../server/db/index";
import { branches, products, promotions } from "../server/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getAggregatorBranchesFromDb() {
  const resBranches = await db
    .select({
      id: branches.id,
      name: branches.name,
      address: branches.address,
      status: branches.status,
    })
    .from(branches)
    .where(eq(branches.status, "Active"));

  return resBranches;
}

function formatTimestamp(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export async function generateDirectCsvPreviewFromDb(connectionId: string) {
  let conn: any = null;
  if (connectionId) {
    try {
      const list: any[] = await db.execute(
        sql`SELECT vendor_id, price_format, aggregator_name, remote_directory FROM aggregator_connections WHERE id::text = ${connectionId}`
      );
      if (list && list.length > 0) {
        conn = {
          vendorId: list[0].vendor_id,
          priceFormat: list[0].price_format,
          aggregatorName: list[0].aggregator_name,
          remoteDirectory: list[0].remote_directory,
        };
      }
    } catch (e) {}
  }

  const vendorId = (conn?.vendorId || "vendor_id").trim();
  const priceFormat = conn?.priceFormat || "price_discounted";

  const dbProducts = await db.select().from(products);
  if (!dbProducts || dbProducts.length === 0) {
    throw new Error("Unable to load products from database — no products found.");
  }

  let dbPromotions: any[] = [];
  try {
    dbPromotions = await db.select().from(promotions);
  } catch (err) {}

  const now = new Date();
  const future = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const activePromos = dbPromotions.filter((p) => {
    if (!p.status || p.status.toLowerCase() !== "active") return false;
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });

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
  const uniqueItemsMap = new Map<string, any>();
  dbProducts.forEach((item, idx) => {
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
    const priceVal = parseFloat(p.salePrice || "15.00").toFixed(2);
    const activeVal = p.status && p.status.toLowerCase() === "inactive" ? "0" : "1";

    // 3. Promotion fields block rule
    const matchingPromo = activePromos.find((promo) => {
      if (promo.tenantId && p.tenantId && promo.tenantId !== p.tenantId) return false;
      if (promo.targetProductIds) {
        try {
          const ids: string[] =
            typeof promo.targetProductIds === "string" && promo.targetProductIds.startsWith("[")
              ? JSON.parse(promo.targetProductIds)
              : promo.targetProductIds.split(",").map((s: string) => s.trim());
          if (ids.includes(p.id)) return true;
        } catch (e) {
          if (promo.targetProductIds.includes(p.id)) return true;
        }
      }
      if (promo.targetCategory && p.category) {
        if (promo.targetCategory.toLowerCase() === p.category.toLowerCase()) return true;
      }
      if (promo.target === "All" || (!promo.targetCategory && !promo.targetProductIds)) return true;
      return false;
    });

    let reason = "";
    let startDt = "";
    let endDt = "";
    let campaignStatus = "";
    let promoPrice = "";
    let maxOrders = "";

    if (matchingPromo) {
      activePromoCount++;
      reason = "competitiveness";
      startDt = formatTimestamp(matchingPromo.startDate ? new Date(matchingPromo.startDate) : now);
      endDt = formatTimestamp(matchingPromo.endDate ? new Date(matchingPromo.endDate) : future);
      campaignStatus = "1";

      const priceNum = parseFloat(p.salePrice || "15.00");
      const discountValNum = parseFloat(matchingPromo.discountValue || "0.00");
      let calculatedDisc = priceNum;
      const dType = (matchingPromo.discountType || "").toLowerCase();
      if (dType === "percentage") {
        calculatedDisc = Math.max(0, priceNum * (1 - discountValNum / 100));
      } else if (dType === "fixed") {
        calculatedDisc = Math.max(0, priceNum - discountValNum);
      }

      promoPrice = calculatedDisc.toFixed(2);
      maxOrders = matchingPromo.maxQty ? String(matchingPromo.maxQty) : "500";
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

  const csvContent = rows.join("\n");
  const fileName = `assortment_${vendorId}.csv`;

  if (connectionId) {
    try {
      await db.execute(
        sql`INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, created_at) VALUES (${connectionId}::uuid, 'preview', 'preview_only', ${fileName}, ${finalItems.length}, NOW());`
      );
    } catch (e) {}
  }

  return {
    success: true,
    isPreviewOnly: true,
    fileName,
    remotePath: `${conn?.remoteDirectory || "/Assortment"}/${fileName}`,
    recordCount: finalItems.length,
    fileSizeBytes: Buffer.byteLength(csvContent, "utf-8"),
    csvContent,
    warning,
  };
}

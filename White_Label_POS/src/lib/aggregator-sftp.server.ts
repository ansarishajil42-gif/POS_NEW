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

  const vendorId = conn?.vendorId || "vendor_id";
  const dbProducts = await db.select().from(products);
  if (!dbProducts || dbProducts.length === 0) {
    throw new Error("Unable to load products from database — no products found.");
  }

  let dbPromotions: any[] = [];
  try {
    dbPromotions = await db.select().from(promotions);
  } catch (err) {}

  const now = new Date();
  const activePromos = dbPromotions.filter((p) => {
    if (!p.status || p.status.toLowerCase() !== "active") return false;
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return now >= start && now <= end;
  });

  const lines: string[] = [
    "Barcode/SKU,Price,Active,Discounted price,Discount Start,Discount End,Max no of orders",
  ];

  let recordCount = 0;

  dbProducts.forEach((p, idx) => {
    const code = p.barcode || `SKU-${idx + 100}`;
    const priceNum = parseFloat(p.salePrice || "15.00");
    const origPriceStr = priceNum.toFixed(2);
    let activeStr = "TRUE";

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

    let discPriceStr = "";
    let startDateStr = "";
    let endDateStr = "";
    let maxOrdersStr = "";

    if (matchingPromo) {
      const discountValNum = parseFloat(matchingPromo.discountValue || "0.00");
      let calculatedDisc = priceNum;
      const dType = (matchingPromo.discountType || "").toLowerCase();
      if (dType === "percentage") {
        calculatedDisc = Math.max(0, priceNum * (1 - discountValNum / 100));
      } else if (dType === "fixed") {
        calculatedDisc = Math.max(0, priceNum - discountValNum);
      }
      discPriceStr = calculatedDisc.toFixed(2);

      const sDate = new Date(matchingPromo.startDate);
      const eDate = new Date(matchingPromo.endDate);
      startDateStr = sDate.toISOString().replace("T", " ").substring(0, 19);
      endDateStr = eDate.toISOString().replace("T", " ").substring(0, 19);
      maxOrdersStr = matchingPromo.maxQty ? String(matchingPromo.maxQty) : "500";
    }

    lines.push(
      `${code},${origPriceStr},${activeStr},${discPriceStr},${startDateStr},${endDateStr},${maxOrdersStr}`
    );
    recordCount++;
  });

  const csvContent = lines.join("\n");
  const fileName = `assortment_${vendorId}.csv`;

  if (connectionId) {
    try {
      await db.execute(
        sql`INSERT INTO aggregator_sync_logs (aggregator_connection_id, sync_type, status, file_name, row_count, created_at) VALUES (${connectionId}::uuid, 'preview', 'preview_only', ${fileName}, ${recordCount}, NOW());`
      );
    } catch (e) {}
  }

  return {
    success: true,
    isPreviewOnly: true,
    fileName,
    remotePath: `${conn?.remoteDirectory || "/Assortment"}/${fileName}`,
    recordCount,
    fileSizeBytes: Buffer.byteLength(csvContent, "utf-8"),
    csvContent,
  };
}

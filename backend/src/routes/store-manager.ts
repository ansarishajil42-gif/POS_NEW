import { Router } from "express";
import { db } from "../db/index.js";
import {
  branches,
  stockLevels,
  products,
  orders,
  shifts,
  rolePermissions,
  priceOverrideRequests,
  staffUsers,
  tills,
  stockAdjustments,
  orderPayments
} from "../db/schema.js";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import bcrypt from "bcryptjs";

const router = Router();
router.use(requireAuth);

// 1. Unified Dashboard Data Fetch
router.get("/data", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const branchId = (req as AuthRequest).user?.branchId;
  const userId = (req as AuthRequest).user?.id;

  if (!tenantId || !branchId) {
    return res.status(400).json({ error: "Missing authorization context (tenantId/branchId)" });
  }

  try {
    // 1. Get branch info
    const [branchInfo] = await db
      .select()
      .from(branches)
      .where(eq(branches.id, branchId));

    // 2. Get local stock & products
    const localStock = await db
      .select({
        id: stockLevels.id,
        stock: stockLevels.stock,
        priceOverride: stockLevels.priceOverride,
        productId: products.id,
        productName: products.name,
        sku: products.barcode, // fallback sku to barcode
        barcode: products.barcode,
        category: products.category,
        unit: products.unit,
        basePrice: products.salePrice,
      })
      .from(stockLevels)
      .innerJoin(products, eq(stockLevels.productId, products.id))
      .where(eq(stockLevels.branchId, branchId));

    // 3. Get recent shifts (including cashier name)
    const shiftsList = await db
      .select({
        id: shifts.id,
        openedAt: shifts.openedAt,
        closedAt: shifts.closedAt,
        openingFloat: shifts.openingFloat,
        cashDrops: shifts.cashDrops,
        expectedCash: shifts.expectedCash,
        actualCash: shifts.actualCash,
        status: shifts.status,
        tillId: shifts.tillId,
        startTime: shifts.startTime,
        endTime: shifts.endTime,
        shiftDate: shifts.shiftDate,
        notes: shifts.notes,
        cashierId: shifts.cashierId,
        cashierName: staffUsers.name,
        cashierEmail: staffUsers.email,
      })
      .from(shifts)
      .leftJoin(staffUsers, eq(shifts.cashierId, staffUsers.id))
      .where(eq(shifts.branchId, branchId))
      .orderBy(desc(shifts.openedAt))
      .limit(50);

    // 4. Get recent orders
    const recentOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.branchId, branchId))
      .orderBy(desc(orders.createdAt))
      .limit(100);

    // 5. Get override requests
    const dbRequests = await db
      .select({
        id: priceOverrideRequests.id,
        productId: priceOverrideRequests.productId,
        productName: products.name,
        standardPrice: priceOverrideRequests.standardPrice,
        requestedPrice: priceOverrideRequests.requestedPrice,
        reason: priceOverrideRequests.reason,
        status: priceOverrideRequests.status,
        createdAt: priceOverrideRequests.createdAt,
      })
      .from(priceOverrideRequests)
      .innerJoin(products, eq(priceOverrideRequests.productId, products.id))
      .where(eq(priceOverrideRequests.branchId, branchId))
      .orderBy(desc(priceOverrideRequests.createdAt));

    // 6. Get branch staff
    const dbStaff = await db
      .select({
        id: staffUsers.id,
        name: staffUsers.name,
        email: staffUsers.email,
        role: staffUsers.role,
        isActive: staffUsers.isActive,
      })
      .from(staffUsers)
      .where(and(eq(staffUsers.tenantId, tenantId), eq(staffUsers.branchId, branchId)));

    // 7. Get branch tills
    const dbTills = await db
      .select()
      .from(tills)
      .where(eq(tills.branchId, branchId))
      .orderBy(desc(tills.createdAt));

    // 8. Get permissions
    const dbPerms = await db
      .select()
      .from(rolePermissions)
      .where(and(eq(rolePermissions.tenantId, tenantId), eq(rolePermissions.role, "branch_manager")));

    const shiftsWithTillName = shiftsList.map((s) => {
      const matchedTill = dbTills.find((t) => t.id === s.tillId || t.name === s.tillId);
      return {
        ...s,
        tillName: matchedTill ? matchedTill.name : s.tillId || "N/A"
      };
    });

    res.json({
      branch: branchInfo || null,
      stock: localStock,
      shifts: shiftsWithTillName,
      orders: recentOrders,
      requests: dbRequests,
      staff: dbStaff,
      tills: dbTills,
      permissions: dbPerms,
    });
  } catch (error) {
    console.error("Store manager get data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 2. Create Override Request
router.post("/override-request", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const branchId = (req as AuthRequest).user?.branchId;
  if (!tenantId || !branchId) return res.status(400).json({ error: "Unauthorized" });

  const { productId, requestedPrice, reason } = req.body;
  if (!productId || requestedPrice === undefined || !reason) {
    return res.status(400).json({ error: "productId, requestedPrice, and reason are required" });
  }

  try {
    const [stockItem] = await db
      .select({ id: stockLevels.id })
      .from(stockLevels)
      .where(and(eq(stockLevels.productId, productId), eq(stockLevels.branchId, branchId)));

    if (!stockItem) {
      return res.status(404).json({ error: "Product stock level not found for this branch" });
    }

    const [product] = await db
      .select({ salePrice: products.salePrice })
      .from(products)
      .where(eq(products.id, productId));

    await db.insert(priceOverrideRequests).values({
      tenantId,
      branchId,
      productId,
      stockLevelId: stockItem.id,
      standardPrice: product?.salePrice || "0.00",
      requestedPrice: String(requestedPrice),
      reason: reason.trim(),
      status: "Pending",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Create override request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 3. Edit Override Request
router.put("/override-request/:id", async (req, res) => {
  const branchId = (req as AuthRequest).user?.branchId;
  if (!branchId) return res.status(400).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { requestedPrice } = req.body;

  if (requestedPrice === undefined || isNaN(Number(requestedPrice))) {
    return res.status(400).json({ error: "Valid requestedPrice is required" });
  }

  try {
    await db
      .update(priceOverrideRequests)
      .set({ requestedPrice: String(requestedPrice) })
      .where(and(eq(priceOverrideRequests.id, id), eq(priceOverrideRequests.branchId, branchId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Edit override request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 4. Delete Override Request
router.delete("/override-request/:id", async (req, res) => {
  const branchId = (req as AuthRequest).user?.branchId;
  if (!branchId) return res.status(400).json({ error: "Unauthorized" });

  const { id } = req.params;

  try {
    await db
      .delete(priceOverrideRequests)
      .where(and(eq(priceOverrideRequests.id, id), eq(priceOverrideRequests.branchId, branchId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete override request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 5. Create Roster Shift
router.post("/roster-shifts", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const branchId = (req as AuthRequest).user?.branchId;
  if (!tenantId || !branchId) return res.status(400).json({ error: "Unauthorized" });

  const { cashierId, tillId, shiftDate, startTime, endTime, notes } = req.body;
  if (!cashierId || !tillId || !shiftDate || !startTime || !endTime) {
    return res.status(400).json({ error: "cashierId, tillId, shiftDate, startTime, and endTime are required" });
  }

  try {
    await db.insert(shifts).values({
      tenantId,
      branchId,
      cashierId,
      tillId,
      shiftDate,
      startTime,
      endTime,
      notes: notes || "",
      status: "Scheduled",
      openingFloat: "0.00",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Create roster shift error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 6. Delete Roster Shift
router.delete("/roster-shifts/:id", async (req, res) => {
  const branchId = (req as AuthRequest).user?.branchId;
  if (!branchId) return res.status(400).json({ error: "Unauthorized" });

  const { id } = req.params;

  try {
    await db
      .delete(shifts)
      .where(and(eq(shifts.id, id), eq(shifts.branchId, branchId), eq(shifts.status, "Scheduled")));

    res.json({ success: true });
  } catch (error) {
    console.error("Delete roster shift error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 7. Create Till
router.post("/tills", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const branchId = (req as AuthRequest).user?.branchId;
  const userId = (req as AuthRequest).user?.id;
  if (!tenantId || !branchId || !userId) return res.status(400).json({ error: "Unauthorized" });

  const { name, description, openingFloat } = req.body;
  if (!name) return res.status(400).json({ error: "Till name is required" });

  try {
    await db.insert(tills).values({
      tenantId,
      branchId,
      name: name.trim(),
      description: description || "",
      status: "Closed",
      openingFloat: String(openingFloat || "0.00"),
      createdBy: userId,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Create till error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 8. Reset Cashier PIN
router.post("/staff/:id/reset-pin", async (req, res) => {
  const branchId = (req as AuthRequest).user?.branchId;
  if (!branchId) return res.status(400).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { newPin, confirmPin } = req.body;

  if (!newPin || !confirmPin) {
    return res.status(400).json({ error: "newPin and confirmPin are required" });
  }
  if (newPin !== confirmPin) {
    return res.status(400).json({ error: "PIN values do not match" });
  }
  if (!/^\d{4}$/.test(newPin)) {
    return res.status(400).json({ error: "PIN must be exactly 4 digits" });
  }

  try {
    const hashed = await bcrypt.hash(newPin, 10);
    await db
      .update(staffUsers)
      .set({ pinHash: hashed })
      .where(and(eq(staffUsers.id, id), eq(staffUsers.branchId, branchId)));

    res.json({ success: true });
  } catch (error) {
    console.error("Reset cashier PIN error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 9. Record Cash Drop
router.post("/shifts/:id/cash-drop", async (req, res) => {
  const branchId = (req as AuthRequest).user?.branchId;
  if (!branchId) return res.status(400).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { amount, note } = req.body;

  if (amount === undefined || isNaN(Number(amount))) {
    return res.status(400).json({ error: "Valid drop amount is required" });
  }

  try {
    const [shift] = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.id, id), eq(shifts.branchId, branchId)));

    if (!shift) return res.status(404).json({ error: "Shift not found" });

    const drops = JSON.parse(shift.cashDrops || "[]");
    drops.push({
      amount: Number(amount),
      note: note || "",
      timestamp: new Date().toISOString()
    });

    await db
      .update(shifts)
      .set({ cashDrops: JSON.stringify(drops) })
      .where(and(eq(shifts.id, id), eq(shifts.branchId, branchId)));

    res.json({ success: true, drops });
  } catch (error) {
    console.error("Record cash drop error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 10. Close Shift with dynamic sales evaluation
router.post("/shifts/:id/close", async (req, res) => {
  const branchId = (req as AuthRequest).user?.branchId;
  if (!branchId) return res.status(400).json({ error: "Unauthorized" });

  const { id } = req.params;
  const { actualCash } = req.body;

  if (actualCash === undefined || isNaN(Number(actualCash))) {
    return res.status(400).json({ error: "Valid actual cash count is required" });
  }

  try {
    const [shift] = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.id, id), eq(shifts.branchId, branchId)));

    if (!shift) return res.status(404).json({ error: "Shift not found" });

    // Compute expected cash = openingFloat + cashSales - totalDrops
    const cashSalesResult = await db
      .select({ total: sql<string>`coalesce(sum(${orderPayments.amount}), '0.00')` })
      .from(orderPayments)
      .innerJoin(orders, eq(orderPayments.orderId, orders.id))
      .where(
        and(
          eq(orders.cashierId, shift.cashierId),
          eq(orders.branchId, branchId),
          eq(orderPayments.method, "Cash"),
          gte(orders.createdAt, shift.openedAt)
        )
      );

    const cashSales = parseFloat(cashSalesResult[0].total || "0.00");
    const drops = JSON.parse(shift.cashDrops || "[]");
    const totalDrops = drops.reduce((sum: number, d: any) => sum + parseFloat(d.amount || 0), 0);

    const expectedCash = parseFloat(shift.openingFloat || "0.00") + cashSales - totalDrops;

    await db
      .update(shifts)
      .set({
        status: "Closed",
        closedAt: new Date(),
        actualCash: Number(actualCash).toFixed(2),
        expectedCash: expectedCash.toFixed(2),
      })
      .where(and(eq(shifts.id, id), eq(shifts.branchId, branchId)));

    res.json({
      success: true,
      shiftId: id,
      openingFloat: shift.openingFloat,
      cashSales: cashSales.toFixed(2),
      totalDrops: totalDrops.toFixed(2),
      expectedCash: expectedCash.toFixed(2),
      actualCash: Number(actualCash).toFixed(2),
      variance: (Number(actualCash) - expectedCash).toFixed(2)
    });
  } catch (error) {
    console.error("Close shift error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 11. Adjust Product Stock Level and Log Adjustment
router.post("/stock/adjust", async (req, res) => {
  const tenantId = (req as AuthRequest).user?.tenantId;
  const branchId = (req as AuthRequest).user?.branchId;
  const userId = (req as AuthRequest).user?.id;
  if (!tenantId || !branchId || !userId) return res.status(400).json({ error: "Unauthorized" });

  const { productId, quantityChange, reason, note } = req.body;

  if (!productId || quantityChange === undefined || isNaN(Number(quantityChange)) || !reason) {
    return res.status(400).json({ error: "productId, quantityChange, and reason are required" });
  }

  try {
    const [stockItem] = await db
      .select()
      .from(stockLevels)
      .where(and(eq(stockLevels.productId, productId), eq(stockLevels.branchId, branchId)));

    const prevQty = stockItem ? stockItem.stock : 0;
    const newQty = prevQty + Number(quantityChange);

    if (stockItem) {
      await db
        .update(stockLevels)
        .set({ stock: newQty })
        .where(eq(stockLevels.id, stockItem.id));
    } else {
      await db.insert(stockLevels).values({
        productId,
        branchId,
        stock: newQty,
        reorderLevel: 10,
      });
    }

    // Insert stock adjustments log
    await db.insert(stockAdjustments).values({
      tenantId,
      branchId,
      productId,
      previousQuantity: prevQty,
      quantityChange: Number(quantityChange),
      newQuantity: newQty,
      reason: note ? `${reason}: ${note}` : reason,
      adjustedBy: userId,
    });

    res.json({ success: true, previousQuantity: prevQty, newQuantity: newQty });
  } catch (error) {
    console.error("Adjust stock error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 12. Get Stock Adjustment History logs
router.get("/stock/adjust/history", async (req, res) => {
  const branchId = (req as AuthRequest).user?.branchId;
  if (!branchId) return res.status(400).json({ error: "Unauthorized" });

  try {
    const history = await db
      .select({
        id: stockAdjustments.id,
        productName: products.name,
        previousQuantity: stockAdjustments.previousQuantity,
        quantityChange: stockAdjustments.quantityChange,
        newQuantity: stockAdjustments.newQuantity,
        reason: stockAdjustments.reason,
        adjustedByName: staffUsers.name,
        createdAt: stockAdjustments.createdAt,
      })
      .from(stockAdjustments)
      .innerJoin(products, eq(stockAdjustments.productId, products.id))
      .leftJoin(staffUsers, eq(stockAdjustments.adjustedBy, staffUsers.id))
      .where(eq(stockAdjustments.branchId, branchId))
      .orderBy(desc(stockAdjustments.createdAt));

    res.json(history);
  } catch (error) {
    console.error("Get stock adjustments history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

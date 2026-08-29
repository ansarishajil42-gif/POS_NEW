import { Router } from "express";
import { db } from "../db/index.js";
import { products, batches, productBarcodes, productVariants, unitConversions } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

// Get products (filtered by tenantId automatically from (req as any).user)
router.get("/", async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  const { category } = req.query;
  
  if (!tenantId) return res.status(401).json({ error: "Unauthorized: Missing tenantId" });

  try {
    let conditions = [eq(products.tenantId, tenantId)];
    if (category) {
      conditions.push(eq(products.category, category as string));
    }

    // Get basic products
    const productsList = await db.select().from(products).where(and(...conditions));
    
    // For a real production app, we would fetch these more optimally or use db.query.products.findMany({with: {...}})
    // But since the current schema.ts might not have relations defined for Drizzle query builder,
    // we'll fetch relations manually.
    
    const productIds = productsList.map(p => p.id);
    if (productIds.length === 0) return res.json([]);

    const [barcodesList, variantsList, conversionsList] = await Promise.all([
      db.select().from(productBarcodes),
      db.select().from(productVariants),
      db.select().from(unitConversions)
    ]);

    const result = productsList.map(p => ({
      ...p,
      barcodes: barcodesList.filter(b => b.productId === p.id).map(b => b.barcode),
      variants: variantsList.filter(v => v.productId === p.id),
      unitConversions: conversionsList.filter(c => c.productId === p.id),
    }));

    res.json(result);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single product details
router.get("/:id", async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  const { id } = req.params;
  
  try {
    const productList = await db.select().from(products).where(and(eq(products.id, id), eq(products.tenantId, tenantId as string)));
    if (productList.length === 0) return res.status(404).json({ error: "Product not found" });
    const product = productList[0];

    const [barcodes, variants, conversions, batchList] = await Promise.all([
      db.select().from(productBarcodes).where(eq(productBarcodes.productId, id)),
      db.select().from(productVariants).where(eq(productVariants.productId, id)),
      db.select().from(unitConversions).where(eq(unitConversions.productId, id)),
      db.select().from(batches).where(eq(batches.productId, id))
    ]);

    res.json({
      ...product,
      barcodes: barcodes.map(b => b.barcode),
      variants,
      unitConversions: conversions,
      batches: batchList
    });
  } catch (error) {
    console.error("Fetch product detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create product
router.post("/", async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  if (!tenantId) return res.status(401).json({ error: "Unauthorized" });

  const { name, barcode, category, unit, costPrice, salePrice, isBatchTracked, barcodes, variants, unitConversions: uConversions } = req.body;

  if (!name || !category || !unit || costPrice === undefined || salePrice === undefined) {
    return res.status(400).json({ error: "Required fields: name, category, unit, costPrice, salePrice" });
  }

  try {
    const newProduct = await db.insert(products).values({
      tenantId,
      name,
      barcode: barcode || null,
      category,
      unit,
      costPrice: costPrice.toString(),
      salePrice: salePrice.toString(),
      isBatchTracked: isBatchTracked || false,
    }).returning();

    const productId = newProduct[0].id;

    if (barcodes && Array.isArray(barcodes) && barcodes.length > 0) {
      const barcodeVals = barcodes.filter(b => b).map(b => ({ productId, barcode: b }));
      if (barcodeVals.length > 0) await db.insert(productBarcodes).values(barcodeVals);
    }

    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantVals = variants.map(v => ({
        productId,
        variantName: v.variantName,
        variantValue: v.variantValue,
        sku: v.sku || null,
        priceAdjustment: (v.priceAdjustment || "0").toString()
      }));
      await db.insert(productVariants).values(variantVals);
    }

    if (uConversions && Array.isArray(uConversions) && uConversions.length > 0) {
      const convVals = uConversions.map(c => ({
        productId,
        fromUnit: c.fromUnit,
        toUnit: c.toUnit,
        conversionFactor: c.conversionFactor.toString()
      }));
      await db.insert(unitConversions).values(convVals);
    }

    res.status(201).json({ ...newProduct[0], barcodes, variants, unitConversions: uConversions });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update product
router.patch("/:id", async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  const { id } = req.params;
  const { name, barcode, category, unit, costPrice, salePrice, isBatchTracked, barcodes, variants, unitConversions: uConversions } = req.body;

  try {
    // Check ownership
    const existing = await db.select().from(products).where(and(eq(products.id, id), eq(products.tenantId, tenantId as string)));
    if (existing.length === 0) return res.status(404).json({ error: "Product not found or unauthorized" });

    const updated = await db.update(products)
      .set({
        ...(name && { name }),
        ...(barcode !== undefined && { barcode }),
        ...(category && { category }),
        ...(unit && { unit }),
        ...(costPrice !== undefined && { costPrice: costPrice.toString() }),
        ...(salePrice !== undefined && { salePrice: salePrice.toString() }),
        ...(isBatchTracked !== undefined && { isBatchTracked }),
      })
      .where(eq(products.id, id))
      .returning();

    // If arrays provided, replace them completely
    if (barcodes && Array.isArray(barcodes)) {
      await db.delete(productBarcodes).where(eq(productBarcodes.productId, id));
      const barcodeVals = barcodes.filter(b => b).map(b => ({ productId: id, barcode: b }));
      if (barcodeVals.length > 0) await db.insert(productBarcodes).values(barcodeVals);
    }

    if (variants && Array.isArray(variants)) {
      await db.delete(productVariants).where(eq(productVariants.productId, id));
      if (variants.length > 0) {
        const variantVals = variants.map(v => ({
          productId: id,
          variantName: v.variantName,
          variantValue: v.variantValue,
          sku: v.sku || null,
          priceAdjustment: (v.priceAdjustment || "0").toString()
        }));
        await db.insert(productVariants).values(variantVals);
      }
    }

    if (uConversions && Array.isArray(uConversions)) {
      await db.delete(unitConversions).where(eq(unitConversions.productId, id));
      if (uConversions.length > 0) {
        const convVals = uConversions.map(c => ({
          productId: id,
          fromUnit: c.fromUnit,
          toUnit: c.toUnit,
          conversionFactor: c.conversionFactor.toString()
        }));
        await db.insert(unitConversions).values(convVals);
      }
    }

    res.json(updated[0]);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete product
router.delete("/:id", async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  const { id } = req.params;

  try {
    const existing = await db.select().from(products).where(and(eq(products.id, id), eq(products.tenantId, tenantId as string)));
    if (existing.length === 0) return res.status(404).json({ error: "Product not found or unauthorized" });

    await db.delete(products).where(eq(products.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Batch Management - Add Batch for a product
router.post("/:productId/batches", async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  const { productId } = req.params;
  const { batchNumber, expiryDate, stock } = req.body;

  if (!batchNumber || !expiryDate || stock === undefined) {
    return res.status(400).json({ error: "batchNumber, expiryDate, and stock are required" });
  }

  try {
    const productList = await db.select().from(products).where(and(eq(products.id, productId), eq(products.tenantId, tenantId as string)));
    if (productList.length === 0) return res.status(404).json({ error: "Product not found" });

    const newBatch = await db.insert(batches).values({
      productId,
      batchNumber,
      expiryDate: new Date(expiryDate),
      stock,
    }).returning();
    
    res.status(201).json(newBatch[0]);
  } catch (error) {
    console.error("Create batch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Batch Management - List all batches for a tenant
router.get("/batches/all", async (req, res) => {
  const tenantId = (req as any).user?.tenantId;
  if (!tenantId) return res.status(401).json({ error: "tenantId is required" });

  try {
    const batchesList = await db.select({
      id: batches.id,
      productId: batches.productId,
      productName: products.name,
      batchNumber: batches.batchNumber,
      expiryDate: batches.expiryDate,
      stock: batches.stock,
    })
    .from(batches)
    .innerJoin(products, eq(batches.productId, products.id))
    .where(eq(products.tenantId, tenantId as string));

    res.json(batchesList);
  } catch (error) {
    console.error("Fetch all batches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

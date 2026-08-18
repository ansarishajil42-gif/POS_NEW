import { Router } from "express";
import { db } from "../db/index.js";
import { products, batches } from "../db/schema.js";
import { eq, and } from "drizzle-orm";

const router = Router();

// Get products (optionally filtered by tenantId)
router.get("/", async (req, res) => {
  const { tenantId, category } = req.query;
  try {
    let conditions = [];
    if (tenantId) {
      conditions.push(eq(products.tenantId, tenantId as string));
    }
    if (category) {
      conditions.push(eq(products.category, category as string));
    }

    let result;
    if (conditions.length > 0) {
      result = await db.select().from(products).where(and(...conditions));
    } else {
      result = await db.select().from(products);
    }
    res.json(result);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single product details (including batches)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        batches: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Fetch product detail error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create product
router.post("/", async (req, res) => {
  const { tenantId, name, barcode, category, unit, costPrice, salePrice, stock, reorderLevel, isBatchTracked } = req.body;

  if (!tenantId || !name || !category || !unit || costPrice === undefined || salePrice === undefined) {
    return res.status(400).json({ error: "Required fields: tenantId, name, category, unit, costPrice, salePrice" });
  }

  try {
    const newProduct = await db.insert(products).values({
      tenantId,
      name,
      barcode,
      category,
      unit,
      costPrice: costPrice.toString(),
      salePrice: salePrice.toString(),
      stock: stock || 0,
      reorderLevel: reorderLevel || 10,
      isBatchTracked: isBatchTracked || false,
    }).returning();

    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update product
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, barcode, category, unit, costPrice, salePrice, stock, reorderLevel, isBatchTracked } = req.body;

  try {
    const updated = await db.update(products)
      .set({
        ...(name && { name }),
        ...(barcode !== undefined && { barcode }),
        ...(category && { category }),
        ...(unit && { unit }),
        ...(costPrice !== undefined && { costPrice: costPrice.toString() }),
        ...(salePrice !== undefined && { salePrice: salePrice.toString() }),
        ...(stock !== undefined && { stock }),
        ...(reorderLevel !== undefined && { reorderLevel }),
        ...(isBatchTracked !== undefined && { isBatchTracked }),
      })
      .where(eq(products.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Batch Management - Add Batch for a product
router.post("/:productId/batches", async (req, res) => {
  const { productId } = req.params;
  const { batchNumber, expiryDate, stock } = req.body;

  if (!batchNumber || !expiryDate || stock === undefined) {
    return res.status(400).json({ error: "batchNumber, expiryDate, and stock are required" });
  }

  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const newBatch = await db.insert(batches).values({
      productId,
      batchNumber,
      expiryDate: new Date(expiryDate),
      stock,
    }).returning();

    // Optionally update overall product stock
    if (product.isBatchTracked) {
      await db.update(products)
        .set({ stock: product.stock + Number(stock) })
        .where(eq(products.id, productId));
    }

    res.status(201).json(newBatch[0]);
  } catch (error) {
    console.error("Create batch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Batch Management - List all batches for a tenant
router.get("/batches/all", async (req, res) => {
  const { tenantId } = req.query;
  if (!tenantId) {
    return res.status(400).json({ error: "tenantId is required" });
  }

  try {
    // Join batches with products to filter by tenant
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

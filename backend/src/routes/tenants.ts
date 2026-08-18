import { Router } from "express";
import { db } from "../db/index.js";
import { tenants } from "../db/schema.js";
import { eq } from "drizzle-orm";

const router = Router();

// Get all tenants (super admin utility)
router.get("/", async (req, res) => {
  try {
    const allTenants = await db.select().from(tenants);
    res.json(allTenants);
  } catch (error) {
    console.error("Fetch tenants error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single tenant by ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, id),
    });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.json(tenant);
  } catch (error) {
    console.error("Fetch tenant error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create tenant
router.post("/", async (req, res) => {
  const { name, subdomain, plan } = req.body;
  if (!name || !subdomain) {
    return res.status(400).json({ error: "Name and subdomain are required" });
  }
  try {
    const newTenant = await db.insert(tenants).values({
      name,
      subdomain,
      plan: plan || "Starter",
      status: "Active",
    }).returning();
    res.status(201).json(newTenant[0]);
  } catch (error) {
    console.error("Create tenant error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update tenant status or plan
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, plan, status } = req.body;
  try {
    const updated = await db.update(tenants)
      .set({
        ...(name && { name }),
        ...(plan && { plan }),
        ...(status && { status }),
      })
      .where(eq(tenants.id, id))
      .returning();
    if (updated.length === 0) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.json(updated[0]);
  } catch (error) {
    console.error("Update tenant error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { Router } from "express";
import { eq, count } from "drizzle-orm";
import { db, storesTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

function safeStore(store: typeof storesTable.$inferSelect) {
  return {
    id: store.id,
    ownerId: store.ownerId,
    name: store.name,
    description: store.description ?? null,
    address: store.address ?? null,
    city: store.city ?? null,
    licenseNumber: store.licenseNumber ?? null,
    isVerified: store.isVerified,
    isActive: store.isActive,
    rating: store.rating ? parseFloat(store.rating) : null,
    totalOrders: store.totalOrders,
    createdAt: store.createdAt.toISOString(),
  };
}

// GET /api/stores
router.get("/", async (req, res) => {
  try {
    const { verified, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const whereClause = verified !== undefined ? eq(storesTable.isActive, verified === "true") : undefined;

    const [stores, [{ count: total }]] = await Promise.all([
      db.select().from(storesTable).where(whereClause).limit(limitNum).offset(offset),
      db.select({ count: count() }).from(storesTable).where(whereClause),
    ]);

    res.json({
      stores: stores.map(safeStore),
      total: Number(total),
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    logger.error({ err }, "List stores error");
    res.status(500).json({ error: "Failed to list stores" });
  }
});

// POST /api/stores
router.post("/", requireAuth, requireRole("store_owner", "admin"), async (req, res) => {
  try {
    const { name, description, address, city, licenseNumber } = req.body;
    if (!name) {
      res.status(400).json({ error: "Store name is required" });
      return;
    }

    const [store] = await db
      .insert(storesTable)
      .values({
        ownerId: req.user!.userId,
        name,
        description: description || null,
        address: address || null,
        city: city || null,
        licenseNumber: licenseNumber || null,
        isVerified: false,
        isActive: true,
      })
      .returning();

    res.status(201).json(safeStore(store));
  } catch (err) {
    logger.error({ err }, "Create store error");
    res.status(500).json({ error: "Failed to create store" });
  }
});

// GET /api/stores/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid store ID" });
      return;
    }
    const [store] = await db.select().from(storesTable).where(eq(storesTable.id, id)).limit(1);
    if (!store) {
      res.status(404).json({ error: "Store not found" });
      return;
    }
    res.json(safeStore(store));
  } catch (err) {
    logger.error({ err }, "Get store error");
    res.status(500).json({ error: "Failed to get store" });
  }
});

// PATCH /api/stores/:id
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid store ID" });
      return;
    }

    const [existing] = await db.select().from(storesTable).where(eq(storesTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Store not found" });
      return;
    }

    // Only owner or admin can update
    if (existing.ownerId !== req.user!.userId && req.user!.role !== "admin") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const { name, description, address, city, licenseNumber } = req.body;
    const updates: Partial<typeof storesTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber;
    updates.updatedAt = new Date();

    const [updated] = await db.update(storesTable).set(updates).where(eq(storesTable.id, id)).returning();
    res.json(safeStore(updated));
  } catch (err) {
    logger.error({ err }, "Update store error");
    res.status(500).json({ error: "Failed to update store" });
  }
});

export default router;

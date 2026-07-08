import { Router } from "express";
import { eq, count, ilike, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

function safeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    avatar: user.avatar ?? null,
    isActive: user.isActive,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

// GET /api/users — admin only
router.get("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { role, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const whereClause = role ? eq(usersTable.role, role) : undefined;

    const [users, [{ count: total }]] = await Promise.all([
      db
        .select()
        .from(usersTable)
        .where(whereClause)
        .orderBy(usersTable.createdAt)
        .limit(limitNum)
        .offset(offset),
      db.select({ count: count() }).from(usersTable).where(whereClause),
    ]);

    res.json({
      users: users.map(safeUser),
      total: Number(total),
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    logger.error({ err }, "List users error");
    res.status(500).json({ error: "Failed to list users" });
  }
});

// GET /api/users/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    // Users can only view their own profile unless admin
    if (req.user!.userId !== id && req.user!.role !== "admin") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(safeUser(user));
  } catch (err) {
    logger.error({ err }, "Get user error");
    res.status(500).json({ error: "Failed to get user" });
  }
});

// PATCH /api/users/:id
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    if (req.user!.userId !== id && req.user!.role !== "admin") {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    const { name, phone, avatar } = req.body;
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;
    updates.updatedAt = new Date();

    const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(safeUser(updated));
  } catch (err) {
    logger.error({ err }, "Update user error");
    res.status(500).json({ error: "Failed to update user" });
  }
});

// PATCH /api/users/:id/status — admin only
router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }

    const { isActive } = req.body;
    if (typeof isActive !== "boolean") {
      res.status(400).json({ error: "isActive (boolean) required" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(safeUser(updated));
  } catch (err) {
    logger.error({ err }, "Update user status error");
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;

import { Router } from "express";
import { eq, or, count } from "drizzle-orm";
import { db, ordersTable, storesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

function safeOrder(order: typeof ordersTable.$inferSelect) {
  return {
    id: order.id,
    customerId: order.customerId,
    storeId: order.storeId,
    deliveryPartnerId: order.deliveryPartnerId ?? null,
    status: order.status,
    totalAmount: order.totalAmount ? parseFloat(order.totalAmount) : null,
    address: order.address ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

// GET /api/orders
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, page = "1" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limit = 20;
    const offset = (pageNum - 1) * limit;
    const { userId, role } = req.user!;

    let baseQuery = db.select().from(ordersTable);

    // Filter by role
    if (role === "customer") {
      const orders = await db.select().from(ordersTable).where(eq(ordersTable.customerId, userId)).orderBy(ordersTable.createdAt).limit(limit).offset(offset);
      const filteredOrders = status ? orders.filter((o) => o.status === status) : orders;
      res.json({ orders: filteredOrders.map(safeOrder), total: filteredOrders.length, page: pageNum });
      return;
    }

    if (role === "delivery_partner") {
      const orders = await db.select().from(ordersTable).where(eq(ordersTable.deliveryPartnerId, userId)).orderBy(ordersTable.createdAt).limit(limit).offset(offset);
      const filtered = status ? orders.filter((o) => o.status === status) : orders;
      res.json({ orders: filtered.map(safeOrder), total: filtered.length, page: pageNum });
      return;
    }

    if (role === "store_owner") {
      const [store] = await db.select().from(storesTable).where(eq(storesTable.ownerId, userId)).limit(1);
      if (!store) {
        res.json({ orders: [], total: 0, page: pageNum });
        return;
      }
      const orders = await db.select().from(ordersTable).where(eq(ordersTable.storeId, store.id)).orderBy(ordersTable.createdAt).limit(limit).offset(offset);
      const filtered = status ? orders.filter((o) => o.status === status) : orders;
      res.json({ orders: filtered.map(safeOrder), total: filtered.length, page: pageNum });
      return;
    }

    // Admin sees all
    const orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt).limit(limit).offset(offset);
    const filtered = status ? orders.filter((o) => o.status === status) : orders;
    res.json({ orders: filtered.map(safeOrder), total: filtered.length, page: pageNum });
  } catch (err) {
    logger.error({ err }, "List orders error");
    res.status(500).json({ error: "Failed to list orders" });
  }
});

// GET /api/orders/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid order ID" });
      return;
    }

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const { userId, role } = req.user!;

    if (role === "admin") {
      res.json(safeOrder(order));
      return;
    }

    if (role === "customer" && order.customerId === userId) {
      res.json(safeOrder(order));
      return;
    }

    if (role === "delivery_partner" && order.deliveryPartnerId === userId) {
      res.json(safeOrder(order));
      return;
    }

    if (role === "store_owner") {
      const [store] = await db.select().from(storesTable).where(eq(storesTable.ownerId, userId)).limit(1);
      if (store && order.storeId === store.id) {
        res.json(safeOrder(order));
        return;
      }
    }

    res.status(403).json({ error: "Insufficient permissions" });
  } catch (err) {
    logger.error({ err }, "Get order error");
    res.status(500).json({ error: "Failed to get order" });
  }
});

// PATCH /api/orders/:id/status
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id ?? ""));
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid order ID" });
      return;
    }

    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    // Role-based update authorization
    const { userId, role } = req.user!;
    if (role === "customer") {
      // Customers can only cancel their own orders
      if (order.customerId !== userId || status !== "cancelled") {
        res.status(403).json({ error: "Customers can only cancel their own orders" });
        return;
      }
    } else if (role === "store_owner") {
      const [store] = await db.select().from(storesTable).where(eq(storesTable.ownerId, userId)).limit(1);
      if (!store || order.storeId !== store.id) {
        res.status(403).json({ error: "You can only update orders for your store" });
        return;
      }
    } else if (role === "delivery_partner") {
      if (order.deliveryPartnerId !== userId) {
        res.status(403).json({ error: "You can only update orders assigned to you" });
        return;
      }
    }
    // admin: unrestricted

    const [updated] = await db
      .update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();

    res.json(safeOrder(updated));
  } catch (err) {
    logger.error({ err }, "Update order status error");
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;

import { Router } from "express";
import { eq, count, and, gte, sql } from "drizzle-orm";
import { db, usersTable, storesTable, ordersTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth.js";
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

// GET /api/dashboard/customer
router.get("/customer", requireAuth, requireRole("customer", "admin"), async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [allOrders, stores] = await Promise.all([
      db.select().from(ordersTable).where(eq(ordersTable.customerId, userId)).orderBy(ordersTable.createdAt).limit(50),
      db.select().from(storesTable).where(eq(storesTable.isActive, true)).limit(6),
    ]);

    const activeStatuses = ["pending", "confirmed", "preparing", "out_for_delivery"];
    const activeOrders = allOrders.filter((o) => activeStatuses.includes(o.status)).length;
    const deliveredOrders = allOrders.filter((o) => o.status === "delivered").length;

    res.json({
      totalOrders: allOrders.length,
      activeOrders,
      deliveredOrders,
      recentOrders: allOrders.slice(0, 5).map(safeOrder),
      nearbyStores: stores.map(safeStore),
    });
  } catch (err) {
    logger.error({ err }, "Customer dashboard error");
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// GET /api/dashboard/store-owner
router.get("/store-owner", requireAuth, requireRole("store_owner", "admin"), async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [store] = await db.select().from(storesTable).where(eq(storesTable.ownerId, userId)).limit(1);

    const orders = store
      ? await db.select().from(ordersTable).where(eq(ordersTable.storeId, store.id)).orderBy(ordersTable.createdAt).limit(100)
      : [];

    const pendingOrders = orders.filter((o) => ["pending", "confirmed", "preparing"].includes(o.status)).length;
    const completedOrders = orders.filter((o) => o.status === "delivered").length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount ? parseFloat(o.totalAmount) : 0), 0);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount ? parseFloat(o.totalAmount) : 0), 0);

    res.json({
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      todayRevenue,
      totalRevenue,
      store: store ? safeStore(store) : null,
      recentOrders: orders.slice(-5).reverse().map(safeOrder),
    });
  } catch (err) {
    logger.error({ err }, "Store owner dashboard error");
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// GET /api/dashboard/delivery
router.get("/delivery", requireAuth, requireRole("delivery_partner", "admin"), async (req, res) => {
  try {
    const userId = req.user!.userId;

    const [allDeliveries, pendingPickupsList] = await Promise.all([
      db.select().from(ordersTable).where(eq(ordersTable.deliveryPartnerId, userId)).orderBy(ordersTable.createdAt).limit(100),
      db.select().from(ordersTable).where(eq(ordersTable.status, "confirmed")).limit(10),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDeliveries = allDeliveries.filter(
      (o) => o.status === "delivered" && new Date(o.createdAt) >= today
    );
    const activeDeliveries = allDeliveries.filter((o) => o.status === "out_for_delivery");

    const perDeliveryEarning = 50;
    const todayEarnings = todayDeliveries.length * perDeliveryEarning;
    const totalEarnings = allDeliveries.filter((o) => o.status === "delivered").length * perDeliveryEarning;

    res.json({
      totalDeliveries: allDeliveries.filter((o) => o.status === "delivered").length,
      activeDeliveries: activeDeliveries.length,
      completedToday: todayDeliveries.length,
      todayEarnings,
      totalEarnings,
      pendingPickups: pendingPickupsList.map(safeOrder),
      activeOrders: activeDeliveries.map(safeOrder),
    });
  } catch (err) {
    logger.error({ err }, "Delivery dashboard error");
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

// GET /api/dashboard/admin
router.get("/admin", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [userStats, allStores, allOrders, recentUsers] = await Promise.all([
      db
        .select({ role: usersTable.role, count: count() })
        .from(usersTable)
        .groupBy(usersTable.role),
      db.select().from(storesTable).limit(200),
      db.select().from(ordersTable).orderBy(ordersTable.createdAt).limit(200),
      db.select().from(usersTable).orderBy(usersTable.createdAt).limit(10),
    ]);

    const roleCounts = Object.fromEntries(userStats.map((r) => [r.role, Number(r.count)]));
    const totalUsers = (Object.values(roleCounts) as number[]).reduce((a: number, b: number) => a + b, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= today);
    const pendingVerifications = allStores.filter((s) => !s.isVerified).length;
    const totalRevenue = allOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + (o.totalAmount ? parseFloat(o.totalAmount) : 0), 0);

    res.json({
      totalUsers,
      totalCustomers: roleCounts["customer"] || 0,
      totalStoreOwners: roleCounts["store_owner"] || 0,
      totalDeliveryPartners: roleCounts["delivery_partner"] || 0,
      totalStores: allStores.length,
      pendingVerifications,
      totalOrders: allOrders.length,
      todayOrders: todayOrders.length,
      totalRevenue,
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone ?? null,
        role: u.role,
        avatar: u.avatar ?? null,
        isActive: u.isActive,
        isVerified: u.isVerified,
        createdAt: u.createdAt.toISOString(),
      })),
      recentOrders: allOrders.slice(-5).reverse().map((o) => ({
        id: o.id,
        customerId: o.customerId,
        storeId: o.storeId,
        deliveryPartnerId: o.deliveryPartnerId ?? null,
        status: o.status,
        totalAmount: o.totalAmount ? parseFloat(o.totalAmount) : null,
        address: o.address ?? null,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    logger.error({ err }, "Admin dashboard error");
    res.status(500).json({ error: "Failed to load admin dashboard" });
  }
});

export default router;

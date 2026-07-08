import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable, storesTable, deliveryProfilesTable } from "@workspace/db";
import { requireAuth, signToken } from "../middlewares/auth.js";
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

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role, storeName, storeAddress, licenseNumber, vehicleType } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "name, email, password, and role are required" });
      return;
    }

    // Public registration is limited to non-admin roles
    const validRoles = ["customer", "store_owner", "delivery_partner"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Invalid role. Admins cannot self-register." });
      return;
    }

    // Check duplicate
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(usersTable)
      .values({ name, email, phone: phone || null, passwordHash, role, isActive: true, isVerified: false })
      .returning();

    // Create role-specific profile
    if (role === "store_owner") {
      await db.insert(storesTable).values({
        ownerId: user.id,
        name: storeName || `${name}'s Medical Store`,
        address: storeAddress || null,
        licenseNumber: licenseNumber || null,
        isVerified: false,
        isActive: true,
      });
    }

    if (role === "delivery_partner") {
      await db.insert(deliveryProfilesTable).values({
        userId: user.id,
        vehicleType: vehicleType || null,
        licenseNumber: licenseNumber || null,
        isAvailable: false,
      });
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    logger.info({ userId: user.id, role: user.role }, "User registered");

    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    logger.error({ err }, "Register error");
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ error: "Account is deactivated. Contact support." });
      return;
    }

    if (!user.passwordHash) {
      res.status(401).json({ error: "This account uses Google login. Please sign in with Google." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    logger.info({ userId: user.id }, "User logged in");

    res.json({ token, user: safeUser(user) });
  } catch (err) {
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json(safeUser(user));
  } catch (err) {
    logger.error({ err }, "Get me error");
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// POST /api/auth/otp/send (placeholder)
router.post("/otp/send", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: "Phone number required" });
    return;
  }
  // Placeholder: in production, integrate Twilio / Firebase Auth
  logger.info({ phone }, "OTP send requested (placeholder)");
  res.json({ message: `OTP sent to ${phone} (demo mode — use code 123456)` });
});

// POST /api/auth/otp/verify (placeholder)
router.post("/otp/verify", async (req, res) => {
  try {
    const { phone, otp, name, role } = req.body;
    if (!phone || !otp || !role) {
      res.status(400).json({ error: "phone, otp, and role required" });
      return;
    }

    // Placeholder verification: accept "123456" as valid OTP (demo only)
    if (otp !== "123456") {
      res.status(400).json({ error: "Invalid OTP. (Demo: use 123456)" });
      return;
    }

    // OTP registration restricted to non-admin roles
    const allowedOtpRoles = ["customer", "delivery_partner"];
    if (!allowedOtpRoles.includes(role)) {
      res.status(400).json({ error: "OTP login only available for customers and delivery partners." });
      return;
    }

    // Find or create user by phone
    let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (!user) {
      if (!name) {
        res.status(400).json({ error: "Name required for new user" });
        return;
      }
      const email = `phone_${phone.replace(/\D/g, "")}@medimarket.local`;
      [user] = await db
        .insert(usersTable)
        .values({ name, email, phone, role, isActive: true, isVerified: true })
        .returning();
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    logger.error({ err }, "OTP verify error");
    res.status(500).json({ error: "OTP verification failed" });
  }
});

export default router;

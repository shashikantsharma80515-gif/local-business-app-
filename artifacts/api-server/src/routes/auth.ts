import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { timingSafeEqual } from "crypto";
import { eq } from "drizzle-orm";
import { db, usersTable, storesTable, deliveryProfilesTable } from "@workspace/db";
import { requireAuth, signToken } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();

// Rate limiter: 10 attempts per 15 minutes for regular login
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

// Stricter rate limiter: 5 attempts per 15 minutes for admin login
const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin login attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

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

// POST /api/auth/register — public registration (customer / store_owner / delivery_partner only)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role, storeName, storeAddress, licenseNumber, vehicleType } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ error: "name, email, password, and role are required" });
      return;
    }

    // Admin accounts can NEVER be created via this endpoint
    const validRoles = ["customer", "store_owner", "delivery_partner"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Invalid role. Admin accounts cannot be created via registration." });
      return;
    }

    // Prevent someone from registering the admin email as a regular user
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && email.toLowerCase() === adminEmail.toLowerCase()) {
      res.status(403).json({ error: "This email address is reserved." });
      return;
    }

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

// POST /api/auth/login — regular users only; admin email is explicitly blocked
router.post("/login", loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    // Block admin email from using the regular login endpoint
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail && email.toLowerCase() === adminEmail.toLowerCase()) {
      res.status(403).json({ error: "Access Denied. Admin accounts must use the admin portal." });
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

// Timing-safe string comparison — prevents timing attacks on constant-time check.
function safeStringEqual(a: string, b: string): boolean {
  try {
    const aBuf = Buffer.from(a, "utf8");
    const bBuf = Buffer.from(b, "utf8");
    // timingSafeEqual requires equal lengths; pad to avoid length leaks.
    if (aBuf.length !== bBuf.length) {
      // Still run a dummy comparison so duration stays constant.
      timingSafeEqual(aBuf, aBuf);
      return false;
    }
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

// POST /api/auth/admin/login — Super Admin only; verified entirely from env vars, never the DB
router.post("/admin/login", adminLoginRateLimiter, async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.error("ADMIN_EMAIL or ADMIN_PASSWORD env vars are not configured");
      res.status(503).json({ error: "Admin login is not configured. Contact the system administrator." });
      return;
    }

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    // Timing-safe comparisons — both run regardless of email match to prevent oracle attacks.
    const emailMatch = safeStringEqual(email.toLowerCase(), adminEmail.toLowerCase());
    const passwordMatch = safeStringEqual(password, adminPassword);

    if (!emailMatch || !passwordMatch) {
      logger.warn({ email }, "Failed admin login attempt");
      res.status(403).json({ error: "Access Denied" });
      return;
    }

    // Admin JWT uses a synthetic id of 0 — admin is not a DB user
    const token = signToken({ userId: 0, role: "admin", email: adminEmail });
    logger.info({ email: adminEmail }, "Super Admin logged in");

    res.json({
      token,
      user: {
        id: 0,
        name: "Super Admin",
        email: adminEmail,
        phone: null,
        role: "admin",
        avatar: null,
        isActive: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error({ err }, "Admin login error");
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
    // Admin is verified purely from JWT + env var — no DB lookup
    if (req.user!.role === "admin") {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail || req.user!.email.toLowerCase() !== adminEmail.toLowerCase()) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      res.json({
        id: 0,
        name: "Super Admin",
        email: adminEmail,
        phone: null,
        role: "admin",
        avatar: null,
        isActive: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
      });
      return;
    }

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

    if (otp !== "123456") {
      res.status(400).json({ error: "Invalid OTP. (Demo: use 123456)" });
      return;
    }

    const allowedOtpRoles = ["customer", "delivery_partner"];
    if (!allowedOtpRoles.includes(role)) {
      res.status(400).json({ error: "OTP login only available for customers and delivery partners." });
      return;
    }

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

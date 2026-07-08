import { pgTable, serial, integer, varchar, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const deliveryProfilesTable = pgTable("delivery_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id).notNull().unique(),
  vehicleType: varchar("vehicle_type", { length: 50 }),
  licenseNumber: varchar("license_number", { length: 100 }),
  isAvailable: boolean("is_available").notNull().default(false),
  totalDeliveries: integer("total_deliveries").notNull().default(0),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeliveryProfileSchema = createInsertSchema(deliveryProfilesTable).omit({
  id: true,
  createdAt: true,
  totalDeliveries: true,
});
export type InsertDeliveryProfile = z.infer<typeof insertDeliveryProfileSchema>;
export type DeliveryProfile = typeof deliveryProfilesTable.$inferSelect;

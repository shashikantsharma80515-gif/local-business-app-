import { pgTable, serial, integer, text, timestamp, numeric, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { storesTable } from "./stores";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => usersTable.id).notNull(),
  storeId: integer("store_id").references(() => storesTable.id).notNull(),
  deliveryPartnerId: integer("delivery_partner_id").references(() => usersTable.id),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tablesTable = pgTable("wedding_tables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  seatsCount: integer("seats_count").notNull().default(8),
  sortOrder: integer("sort_order").notNull().default(0),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTableSchema = createInsertSchema(tablesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTable = z.infer<typeof insertTableSchema>;
export type WeddingTable = typeof tablesTable.$inferSelect;

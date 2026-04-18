import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  guestId: integer("guest_id").notNull(),
  guestName: text("guest_name").notNull(),
  eventType: text("event_type").notNull(),
  payload: text("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;

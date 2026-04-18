import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const guestsTable = pgTable("guests", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  salutationType: text("salutation_type").notNull().default("Дорогой"),
  guestsCount: integer("guests_count").notNull().default(1),
  slug: text("slug").notNull().unique(),
  invitationOpened: boolean("invitation_opened").notNull().default(false),
  gameCompleted: boolean("game_completed").notNull().default(false),
  rsvpStatus: text("rsvp_status").notNull().default("pending"),
  rsvpComment: text("rsvp_comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGuestSchema = createInsertSchema(guestsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guestsTable.$inferSelect;

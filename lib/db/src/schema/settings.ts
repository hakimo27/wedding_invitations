import { pgTable, text, serial, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  weddingTitle: text("wedding_title").notNull().default("Наша Свадьба"),
  brideName: text("bride_name").notNull().default("Анна"),
  groomName: text("groom_name").notNull().default("Александр"),
  weddingDate: text("wedding_date").notNull().default("2025-08-15"),
  weddingTime: text("wedding_time").notNull().default("16:00"),
  venueName: text("venue_name").notNull().default("Ресторан «Белые Ночи»"),
  venueAddress: text("venue_address").notNull().default("г. Москва, ул. Арбат, 1"),
  venueLat: real("venue_lat").notNull().default(55.7558),
  venueLng: real("venue_lng").notNull().default(37.6173),
  mapLink: text("map_link"),
  invitationText: text("invitation_text").notNull().default(
    "С великой радостью приглашаем вас разделить с нами самый счастливый день нашей жизни. В этот торжественный момент мы хотим видеть рядом самых близких и любимых людей. Ваше присутствие сделает наш праздник по-настоящему незабываемым."
  ),
  dressCode: text("dress_code").default("Дресс-код: вечерний наряд. Цветовая гамма: пастельные тона"),
  contacts: text("contacts").default("По всем вопросам: +7 (999) 123-45-67"),
  adminPassword: text("admin_password").notNull().default("wedding2025"),
  gameEnabled: boolean("game_enabled").notNull().default(true),
  countdownEnabled: boolean("countdown_enabled").notNull().default(true),
  activeTemplate: text("active_template").notNull().default("default"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;

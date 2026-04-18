import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function ensureSettings() {
  const existing = await db.select().from(settingsTable);
  if (existing.length === 0) {
    await db.insert(settingsTable).values({}).returning();
  }
  const [settings] = await db.select().from(settingsTable);
  return settings;
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await ensureSettings();
  res.json(settings);
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await ensureSettings();
  const [updated] = await db
    .update(settingsTable)
    .set(parsed.data)
    .returning();
  res.json(updated);
});

export default router;

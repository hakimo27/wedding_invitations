import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Неверный запрос" });
    return;
  }
  const [settings] = await db.select().from(settingsTable);
  const adminPassword = settings?.adminPassword ?? "wedding2025";
  if (parsed.data.password !== adminPassword) {
    res.status(401).json({ error: "Неверный пароль" });
    return;
  }
  const token = crypto.randomBytes(32).toString("hex");
  res.json({ success: true, token });
});

export default router;

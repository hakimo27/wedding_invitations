import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tablesTable } from "@workspace/db";
import {
  CreateTableBody,
  UpdateTableBody,
  UpdateTableParams,
  DeleteTableParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tables", async (_req, res): Promise<void> => {
  const tables = await db.select().from(tablesTable).orderBy(tablesTable.sortOrder, tablesTable.name);
  res.json(tables);
});

router.post("/tables", async (req, res): Promise<void> => {
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: String(parsed.error) });
    return;
  }
  const [table] = await db.insert(tablesTable).values({
    name: parsed.data.name,
    seatsCount: parsed.data.seatsCount ?? 8,
    sortOrder: parsed.data.sortOrder ?? 0,
    note: parsed.data.note ?? null,
  }).returning();
  res.status(201).json(table);
});

router.patch("/tables/:id", async (req, res): Promise<void> => {
  const params = UpdateTableParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateTableBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: String(parsed.error) }); return; }
  const [table] = await db.update(tablesTable).set({
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.seatsCount !== undefined ? { seatsCount: parsed.data.seatsCount } : {}),
    ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
    ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
  }).where(eq(tablesTable.id, params.data.id)).returning();
  if (!table) { res.status(404).json({ error: "Стол не найден" }); return; }
  res.json(table);
});

router.delete("/tables/:id", async (req, res): Promise<void> => {
  const params = DeleteTableParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [table] = await db.delete(tablesTable).where(eq(tablesTable.id, params.data.id)).returning();
  if (!table) { res.status(404).json({ error: "Стол не найден" }); return; }
  res.sendStatus(204);
});

export default router;

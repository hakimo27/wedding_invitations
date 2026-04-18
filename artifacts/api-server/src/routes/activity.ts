import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, activityLogsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/activity", async (_req, res): Promise<void> => {
  const logs = await db
    .select()
    .from(activityLogsTable)
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(50);
  res.json(logs);
});

export default router;

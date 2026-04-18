import { Router, type IRouter } from "express";
import healthRouter from "./health";
import guestsRouter from "./guests";
import settingsRouter from "./settings";
import adminRouter from "./admin";
import tablesRouter from "./tables";
import activityRouter from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(guestsRouter);
router.use(settingsRouter);
router.use(adminRouter);
router.use(tablesRouter);
router.use(activityRouter);

export default router;

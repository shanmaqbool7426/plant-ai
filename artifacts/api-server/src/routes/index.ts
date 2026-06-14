import { Router, type IRouter } from "express";
import healthRouter from "./health";
import plantsRouter from "./plants";
import chatRouter from "./chat";
import scansRouter from "./scans";
import gardenRouter from "./garden";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/plants", plantsRouter);
router.use("/chat", chatRouter);
router.use(scansRouter);
router.use(gardenRouter);
router.use(statsRouter);

export default router;

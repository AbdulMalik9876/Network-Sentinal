import { Router, type IRouter } from "express";
import healthRouter from "./health";
import trafficRouter from "./traffic";
import alertsRouter from "./alerts";
import devicesRouter from "./devices";
import settingsRouter from "./settings";
import portsRouter from "./ports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(trafficRouter);
router.use(alertsRouter);
router.use(devicesRouter);
router.use(settingsRouter);
router.use(portsRouter);

export default router;

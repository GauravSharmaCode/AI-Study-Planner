import { Router, Request, Response } from "express";
import config from "../config";
import { HealthResponse } from "../interfaces";
import { logWithMeta } from "@gauravsharmacode/neat-logger";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  logWithMeta("Health route hit", { func: "health/", level: "info" });
  const response: HealthResponse = {
    status: "success",
    message: `${config.serviceName} is running!`,
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
  res.status(200).json(response);
});

export default router;

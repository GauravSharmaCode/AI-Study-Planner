import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger.js";

const prisma = new PrismaClient();

const DBConnect = async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info("Database connection successful");
  } catch (error) {
    logger.error("Failed to connect to the database:", error);
    process.exit(1);
  }
};

export { prisma, DBConnect };

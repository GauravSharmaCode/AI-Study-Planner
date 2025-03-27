import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger.js";

const prisma = new PrismaClient();

/**
 * Establishes a connection to the database.
 *
 * If the connection fails, logs the error and exits the application with a
 * status code of 1.
 *
 * @returns {Promise<void>}
 */
async function DBConnect() {
  try {
    await prisma.$connect();
    logger.info("Database connection successful");
  } catch (error) {
    logger.error("Failed to connect to the database:", error);
    process.exit(1); // Exit the application if the database connection fails
  }
}

export { prisma, DBConnect };

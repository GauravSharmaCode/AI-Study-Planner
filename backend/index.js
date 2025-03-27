import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import logger from "./utils/logger.js";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.get("/", async (req, res) => {
  try {
    // Example query to test database connection
    const users = await prisma.user.findMany();
    res.status(200).json("DB Connection Successful");
  } catch (error) {
    logger.error("Database query failed", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

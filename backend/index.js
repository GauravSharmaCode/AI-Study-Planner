import express from "express";
import dotenv from "dotenv";
import { DBConnect, prisma } from "./config/db.js"; // Import DBConnect and prisma
import logger from "./utils/logger.js";
import studyPlanRoutes from "./routes/study_plan.js";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

// Test database connection during startup
DBConnect();

app.get("/", async (req, res) => {
  try {
    // Example query to test database connection
    const users = await prisma.user.findMany();

    // Send the response to the client
    res.status(200).json(users);

    // Log the response sent to the client
    logger.info("GET / - Success", {
      statusCode: 200,
      response: users, // Log the full response object
    });
  } catch (error) {
    logger.error("Unable to fetch users due to:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.use("/study-plan", studyPlanRoutes);

async function startServer() {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
  });
}

// Initialize server
startServer();
await DBConnect();

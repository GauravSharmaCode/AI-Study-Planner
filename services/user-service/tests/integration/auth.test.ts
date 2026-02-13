import request from "supertest";
import app from "../../src/index";
import { PrismaClient } from "@prisma/client";

// Skip integration tests unless TEST_DB=on
const describeIntegration =
  process.env.TEST_DB === "on" ? describe : describe.skip;

// Use test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.TEST_DATABASE_URL ||
        "postgresql://test:test@localhost:5433/user_service_test",
    },
  },
});

describeIntegration("Auth API Integration Tests", () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$executeRaw`TRUNCATE TABLE "User" RESTART IDENTITY CASCADE`;
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.user.deleteMany();
  });

  describe("POST /api/v1/auth/register", () => {
    const validUserData = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    };

    it("should register a new user successfully", async () => {
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        status: "success",
        message: "User registered successfully",
        token: expect.any(String),
        data: {
          user: {
            id: expect.any(String),
            email: "test@example.com",
            firstName: "John",
            lastName: "Doe",
            isActive: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
        },
      });

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: "test@example.com" },
      });
      expect(user).toBeTruthy();
      expect(user?.email).toBe("test@example.com");
    });

    it("should return error for duplicate email", async () => {
      // Create user first
      await request(app)
        .post("/api/v1/auth/register")
        .send(validUserData)
        .expect(201);

      // Try to register again with same email
      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(validUserData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: "error",
        message: "User already exists with this email",
      });
    });

    it("should return error for missing fields", async () => {
      const incompleteData = {
        email: "test@example.com",
        password: "password123",
        // Missing firstName and lastName
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(incompleteData)
        .expect(400);

      expect(response.body).toMatchObject({
        status: "error",
        message: "Email, password, firstName, and lastName are required",
      });
    });

    it("should return error for invalid email format", async () => {
      const invalidEmailData = {
        ...validUserData,
        email: "invalid-email",
      };

      const response = await request(app)
        .post("/api/v1/auth/register")
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.status).toBe("error");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    const userData = {
      email: "test@example.com",
      password: "password123",
      firstName: "John",
      lastName: "Doe",
    };

    beforeEach(async () => {
      // Create a user for login tests
      await request(app)
        .post("/api/v1/auth/register")
        .send(userData)
        .expect(201);
    });

    it("should login successfully with valid credentials", async () => {
      const loginData = {
        email: userData.email,
        password: userData.password,
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        status: "success",
        message: "Login successful",
        token: expect.any(String),
        data: {
          user: {
            id: expect.any(String),
            email: "test@example.com",
            firstName: "John",
            lastName: "Doe",
            isActive: true,
            lastLoginAt: expect.any(String),
          },
        },
      });
    });

    it("should return error for invalid password", async () => {
      const loginData = {
        email: userData.email,
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        status: "error",
        message: "Invalid email or password",
      });
    });

    it("should return error for non-existent user", async () => {
      const loginData = {
        email: "nonexistent@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/v1/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toMatchObject({
        status: "error",
        message: "Invalid email or password",
      });
    });
  });

  describe("GET /api/v1/auth/health", () => {
    it("should return health status", async () => {
      const response = await request(app)
        .get("/api/v1/auth/health")
        .expect(200);

      expect(response.body).toMatchObject({
        status: "healthy",
        service: "user-service-auth",
        timestamp: expect.any(String),
      });
    });
  });
});

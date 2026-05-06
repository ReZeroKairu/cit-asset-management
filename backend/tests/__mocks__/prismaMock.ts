import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { prisma } from "../../src/config/database"; // Import your real singleton

// Tell Jest to replace the real database file with our mock
jest.mock("../../src/config/database", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

// Export the mock so we can control it inside our test files
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

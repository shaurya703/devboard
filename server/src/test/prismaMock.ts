import { PrismaClient } from "@prisma/client";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";

// Replace the real prisma client with a deep mock for hermetic tests.
jest.mock("../lib/prisma", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
import { prisma } from "../lib/prisma";

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

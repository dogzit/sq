import { neonConfig, Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

if (typeof window === "undefined") {
  const ws = require("ws");
  neonConfig.webSocketConstructor = ws;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL олдсонгүй! .env файлаа шалгана уу.");
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool as any);

  // Зөвхөн адаптераа дамжуулна, өөр илүү дутуу property байж болохгүй
  return new PrismaClient({
    adapter: adapter as any,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

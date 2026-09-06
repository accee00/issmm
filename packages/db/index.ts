import { config } from "dotenv";
import { resolve } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

if (!process.env.DATABASE_URL) {
  config();
  if (!process.env.DATABASE_URL) {
    config({ path: resolve(__dirname, ".env") });
  }
  if (!process.env.DATABASE_URL) {
    config({ path: resolve(__dirname, "../../.env") });
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined. Please check your .env file.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
 
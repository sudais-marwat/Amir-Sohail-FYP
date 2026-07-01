import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(here, "../../db/schema.sql");
const schema = await readFile(schemaPath, "utf8");
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(schema);
  console.log("Database schema applied.");
} finally {
  await pool.end();
}

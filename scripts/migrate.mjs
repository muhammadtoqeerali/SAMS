import fs from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing. Add it to .env.local or your Vercel environment.");
  process.exit(1);
}

const sql = neon(url);
const schema = await fs.readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const statements = schema
  .split("-- statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log(`SAMS database is ready (${statements.length} migration statements applied).`);

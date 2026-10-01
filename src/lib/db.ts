import { neon } from "@neondatabase/serverless";

let client: ReturnType<typeof neon> | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not configured. Connect a Neon Postgres database and set DATABASE_URL.");
  }
  if (!client) client = neon(url);
  return client;
}

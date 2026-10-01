import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "sams_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 24) {
    throw new Error("AUTH_SECRET must be configured and at least 24 characters long.");
  }
  return value;
}

function signature(expires: string) {
  return createHmac("sha256", secret()).update(`sams:${expires}`).digest("base64url");
}

function secureCompare(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export function passwordMatches(input: string) {
  const expected = process.env.HOUSEHOLD_PASSWORD;
  if (!expected) throw new Error("HOUSEHOLD_PASSWORD is not configured.");
  return secureCompare(input, expected);
}

export async function createSession() {
  const expires = Math.floor(Date.now() / 1000 + THIRTY_DAYS).toString();
  const token = `${expires}.${signature(expires)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || Number(expires) <= Math.floor(Date.now() / 1000)) return false;
  return secureCompare(sig, signature(expires));
}

export async function requireAuth() {
  if (!(await isAuthenticated())) redirect("/login");
}

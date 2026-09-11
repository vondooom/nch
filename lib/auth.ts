import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, StaffUser } from "./types";

const COOKIE = "norcal_staff";

function secret() {
  return (
    process.env.STAFF_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    (process.env.NODE_ENV === "production" ? "" : "norcal-hunt-dev-secret")
  );
}

export function staffAccounts(): Array<StaffUser & { password: string }> {
  return [
    {
      email: (process.env.ADMIN_EMAIL || "admin@norcalhunt.local").toLowerCase(),
      name: "Admin",
      role: "admin",
      password: process.env.ADMIN_PASSWORD || "hunt-admin",
    },
    {
      email: (process.env.EDITOR_EMAIL || "editor@norcalhunt.local").toLowerCase(),
      name: "Editor",
      role: "editor",
      password: process.env.EDITOR_PASSWORD || "hunt-editor",
    },
  ];
}

function sign(value: string) {
  const key = secret();
  if (!key) throw new Error("STAFF_SESSION_SECRET is required in production");
  return createHmac("sha256", key).update(value).digest("base64url");
}

function encode(user: StaffUser) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

function decode(token: string): StaffUser | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as StaffUser & { exp?: number };
    if (data.exp && data.exp < Date.now()) return null;
    return { email: data.email, name: data.name, role: data.role };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<StaffUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return decode(token);
}

export async function requireSession(): Promise<StaffUser> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}

export async function requireRole(role: Role): Promise<StaffUser> {
  const session = await requireSession();
  if (role === "admin" && session.role !== "admin") redirect("/admin");
  return session;
}

export async function createSession(user: StaffUser) {
  const jar = await cookies();
  jar.set(COOKIE, encode(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function canPublish(role: Role) {
  return role === "admin";
}

export function canDelete(role: Role) {
  return role === "admin";
}

export function canManageTeam(role: Role) {
  return role === "admin";
}

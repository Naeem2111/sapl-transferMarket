import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "transfermarket_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionType = "player" | "captain" | "admin" | null;

export async function setPlayerSession(playerId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `p:${playerId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function setCaptainSession(captainId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `c:${captainId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function setAdminSession(adminId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `a:${adminId}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<{ type: "player" | "captain" | "admin"; id: string } | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value ?? null;
  if (!value) return null;
  if (value.startsWith("p:")) return { type: "player", id: value.slice(2) };
  if (value.startsWith("c:")) return { type: "captain", id: value.slice(2) };
  if (value.startsWith("a:")) return { type: "admin", id: value.slice(2) };
  return null;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentPlayer() {
  const session = await getSession();
  if (!session || session.type !== "player") return null;
  return prisma.player.findUnique({ where: { id: session.id } });
}

export async function getCurrentCaptain() {
  const session = await getSession();
  if (!session || session.type !== "captain") return null;
  return prisma.captain.findUnique({ where: { id: session.id } });
}

export async function getCurrentAdmin() {
  const session = await getSession();
  if (!session || session.type !== "admin") return null;
  return prisma.admin.findUnique({ where: { id: session.id } });
}

import crypto from "node:crypto";
import { getCurrentUserFromCookies, getCurrentUserFromRequest } from "@/lib/services/userAuth";

export const adminCookieName = "devup_admin_session";

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

function getAdminKey(): string | null {
  return process.env.ROOT_ACCESS_KEY?.trim() || process.env.ADMIN_ACCESS_KEY?.trim() || null;
}

function getSessionSecret(): string {
  return process.env.AUTH_SECRET?.trim() || getAdminKey() || "devup-local-admin";
}

export function createAdminSessionToken(): string {
  const key = getAdminKey();

  if (!key) {
    return "";
  }

  return crypto.createHmac("sha256", getSessionSecret()).update(key).digest("hex");
}

export function isAdminKeyValid(value: string): boolean {
  const key = getAdminKey();

  if (!key) {
    return false;
  }

  const received = Buffer.from(value);
  const expected = Buffer.from(key);

  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

export function hasAdminKeyCookie(cookies: CookieReader): boolean {
  const token = cookies.get(adminCookieName)?.value;
  return Boolean(token && token === createAdminSessionToken());
}

export async function hasAdminAccessFromCookies(cookies: CookieReader): Promise<boolean> {
  if (hasAdminKeyCookie(cookies)) {
    return true;
  }

  const user = await getCurrentUserFromCookies(cookies);
  return user?.role === "ADMIN";
}

export async function hasAdminRequestAccess(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${adminCookieName}=`))
    ?.split("=")[1];

  if (token && decodeURIComponent(token) === createAdminSessionToken()) {
    return true;
  }

  const user = await getCurrentUserFromRequest(request);
  return user?.role === "ADMIN";
}

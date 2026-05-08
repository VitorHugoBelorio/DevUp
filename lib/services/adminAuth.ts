import crypto from "node:crypto";

export const adminCookieName = "devup_admin_session";

function getAdminKey(): string | null {
  return process.env.ADMIN_ACCESS_KEY?.trim() || null;
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

export function hasAdminCookie(cookies: { get(name: string): { value: string } | undefined }): boolean {
  const token = cookies.get(adminCookieName)?.value;
  return Boolean(token && token === createAdminSessionToken());
}

export function hasAdminRequestAccess(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${adminCookieName}=`))
    ?.split("=")[1];

  return Boolean(token && decodeURIComponent(token) === createAdminSessionToken());
}

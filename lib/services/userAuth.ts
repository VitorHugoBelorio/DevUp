import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { recordAccessEvent } from "@/lib/services/accessControlService";
import { sendMagicLinkEmail } from "@/lib/services/emailService";
import { normalizeText } from "@/lib/utils/text";

export const userSessionCookieName = "devup_user_session";

const magicLinkTtlMinutes = 20;
const sessionTtlDays = 30;

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  emailVerifiedAt: Date | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "BLOCKED";
};

export function normalizeEmail(email: string): string {
  return normalizeText(email).toLowerCase();
}

function createRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getAppOrigin(origin?: string): string {
  return origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getMagicLink(origin: string | undefined, token: string): string {
  return `${getAppOrigin(origin)}/api/auth/verify?token=${encodeURIComponent(token)}`;
}

function isDevLinkEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.EMAIL_DELIVERY_MODE === "console";
}

async function createMagicLinkToken(input: {
  email: string;
  userId: string;
  name?: string | null;
  purpose: "LOGIN" | "VERIFY_EMAIL";
  origin?: string;
}): Promise<{ magicLink: string; devMagicLink?: string }> {
  const token = createRawToken();
  const magicLink = getMagicLink(input.origin, token);

  await prisma.magicLinkToken.create({
    data: {
      email: input.email,
      userId: input.userId,
      purpose: input.purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + magicLinkTtlMinutes * 60 * 1000)
    }
  });

  await sendMagicLinkEmail({
    to: input.email,
    name: input.name,
    magicLink,
    purpose: input.purpose
  });

  await recordAccessEvent({
    userId: input.userId,
    email: input.email,
    type: "MAGIC_LINK_SENT",
    metadata: { purpose: input.purpose }
  });

  return {
    magicLink,
    devMagicLink: isDevLinkEnabled() ? magicLink : undefined
  };
}

export async function requestLoginMagicLink(email: string, origin?: string): Promise<{
  ok: boolean;
  devMagicLink?: string;
  reason?: "USER_NOT_FOUND" | "USER_BLOCKED";
}> {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    return {
      ok: false,
      reason: "USER_NOT_FOUND"
    };
  }

  if (user.status === "BLOCKED") {
    await recordAccessEvent({
      userId: user.id,
      email: normalizedEmail,
      type: "LOGIN_BLOCKED",
      metadata: { reason: "blocked_user" }
    });

    return {
      ok: false,
      reason: "USER_BLOCKED"
    };
  }

  await recordAccessEvent({
    userId: user.id,
    email: normalizedEmail,
    type: "MAGIC_LINK_REQUESTED"
  });

  const purpose = user.emailVerifiedAt ? "LOGIN" : "VERIFY_EMAIL";
  const token = await createMagicLinkToken({
    email: normalizedEmail,
    userId: user.id,
    name: user.name,
    purpose,
    origin
  });

  return {
    ok: true,
    devMagicLink: token.devMagicLink
  };
}

export async function registerWithMagicLink(input: {
  name: string;
  email: string;
  origin?: string;
}): Promise<{ ok: boolean; devMagicLink?: string; reason?: "USER_ALREADY_EXISTS" }> {
  const email = normalizeEmail(input.email);
  const name = normalizeText(input.name);
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser?.emailVerifiedAt) {
    if (existingUser.status === "BLOCKED") {
      await recordAccessEvent({
        userId: existingUser.id,
        email,
        type: "LOGIN_BLOCKED",
        metadata: { reason: "blocked_user_register_attempt" }
      });
    }

    return {
      ok: false,
      reason: "USER_ALREADY_EXISTS"
    };
  }

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: { name }
      })
    : await prisma.user.create({
        data: {
          name,
          email
        }
      });

  await recordAccessEvent({
    userId: user.id,
    email,
    type: "MAGIC_LINK_REQUESTED",
    metadata: { flow: "register" }
  });

  const token = await createMagicLinkToken({
    email,
    userId: user.id,
    name: user.name,
    purpose: "VERIFY_EMAIL",
    origin: input.origin
  });

  return {
    ok: true,
    devMagicLink: token.devMagicLink
  };
}

export async function consumeMagicLink(rawToken: string): Promise<{
  sessionToken: string;
  sessionExpiresAt: Date;
  user: AuthUser;
}> {
  const tokenHash = hashToken(rawToken);
  const token = await prisma.magicLinkToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!token || token.consumedAt || token.expiresAt <= new Date() || !token.user) {
    throw new Error("Magic link invalido ou expirado.");
  }

  if (token.user.status === "BLOCKED") {
    await recordAccessEvent({
      userId: token.user.id,
      email: token.user.email,
      type: "LOGIN_BLOCKED",
      metadata: { reason: "blocked_user_magic_link" }
    });

    throw new Error("Usuario bloqueado.");
  }

  await prisma.magicLinkToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() }
  });

  const user = await prisma.user.update({
    where: { id: token.user.id },
    data: {
      emailVerifiedAt: token.user.emailVerifiedAt ?? new Date()
    }
  });

  const sessionToken = createRawToken();
  const sessionExpiresAt = new Date(Date.now() + sessionTtlDays * 24 * 60 * 60 * 1000);

  await prisma.userSession.create({
    data: {
      userId: token.user.id,
      tokenHash: hashToken(sessionToken),
      expiresAt: sessionExpiresAt
    }
  });

  await recordAccessEvent({
    userId: user.id,
    email: user.email,
    type: "LOGIN_SUCCESS"
  });

  return {
    sessionToken,
    sessionExpiresAt,
    user
  };
}

export async function getCurrentUserFromCookies(cookies: CookieReader): Promise<AuthUser | null> {
  const token = cookies.get(userSessionCookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.userSession
    .findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true }
    })
    .catch(() => null);

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  if (session.user.status === "BLOCKED") {
    return null;
  }

  return session.user;
}

export async function getCurrentUserFromRequest(request: Request): Promise<AuthUser | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${userSessionCookieName}=`))
    ?.split("=")[1];

  if (!token) {
    return null;
  }

  const session = await prisma.userSession
    .findUnique({
      where: { tokenHash: hashToken(decodeURIComponent(token)) },
      include: { user: true }
    })
    .catch(() => null);

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  if (session.user.status === "BLOCKED") {
    return null;
  }

  return session.user;
}

export async function revokeSession(rawToken: string | undefined): Promise<void> {
  if (!rawToken) {
    return;
  }

  const session = await prisma.userSession.findUnique({
    where: {
      tokenHash: hashToken(rawToken)
    },
    include: { user: true }
  });

  await prisma.userSession.deleteMany({
    where: {
      tokenHash: hashToken(rawToken)
    }
  });

  if (session?.user) {
    await recordAccessEvent({
      userId: session.user.id,
      email: session.user.email,
      type: "LOGOUT"
    });
  }
}

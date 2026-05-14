import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/utils/text";
import type {
  AccessDashboardReport,
  AccessEventType,
  AccessLogEntry,
  AccessUserOverview,
  AccessUserRole,
  AccessUserStatus
} from "@/types/access";

type AccessLogInput = {
  userId?: string | null;
  email?: string | null;
  type: AccessEventType;
  request?: Request;
  metadata?: Record<string, unknown>;
};

type UserRecord = {
  id: string;
  name: string | null;
  email: string;
  role: AccessUserRole;
  status: AccessUserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sessions: Array<{ id: string; expiresAt: Date }>;
  diagnostics: Array<{ id: string }>;
  magicLinks: Array<{ id: string }>;
  accessLogs: Array<{ id: string; type: AccessEventType; createdAt: Date }>;
};

function normalizeEmail(email: string): string {
  return normalizeText(email).toLowerCase();
}

function getRequestIp(request?: Request): string | null {
  return (
    request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request?.headers.get("x-real-ip") ??
    null
  );
}

function toAccessLogEntry(record: {
  id: string;
  userId: string | null;
  email: string | null;
  type: AccessEventType;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: { name: string | null } | null;
}): AccessLogEntry {
  return {
    id: record.id,
    userId: record.userId,
    userName: record.user?.name ?? null,
    email: record.email,
    type: record.type,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    createdAt: record.createdAt.toISOString()
  };
}

function toUserOverview(record: UserRecord): AccessUserOverview {
  const now = new Date();
  const activeSessions = record.sessions.filter((session) => session.expiresAt > now).length;
  const lastAccess = record.accessLogs[0] ?? null;
  const lastLogin = record.accessLogs.find((event) => event.type === "LOGIN_SUCCESS") ?? null;

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    status: record.status,
    emailVerifiedAt: record.emailVerifiedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    activeSessions,
    diagnosticsCount: record.diagnostics.length,
    magicLinksCount: record.magicLinks.length,
    accessEventsCount: record.accessLogs.length,
    lastAccessAt: lastAccess?.createdAt.toISOString() ?? null,
    lastLoginAt: lastLogin?.createdAt.toISOString() ?? null
  };
}

export async function recordAccessEvent(input: AccessLogInput): Promise<void> {
  await prisma.accessLog
    .create({
      data: {
        userId: input.userId ?? undefined,
        email: input.email ? normalizeEmail(input.email) : undefined,
        type: input.type,
        ipAddress: getRequestIp(input.request),
        userAgent: input.request?.headers.get("user-agent"),
        metadata: input.metadata as Prisma.InputJsonValue | undefined
      }
    })
    .catch(() => undefined);
}

export async function getAccessDashboardReport(): Promise<AccessDashboardReport> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [users, recentEvents, loginsLast7Days] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: "desc" }, { createdAt: "desc" }],
      include: {
        sessions: true,
        diagnostics: { select: { id: true } },
        magicLinks: { select: { id: true } },
        accessLogs: {
          select: { id: true, type: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    }),
    prisma.accessLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        user: {
          select: { name: true }
        }
      }
    }),
    prisma.accessLog.count({
      where: {
        type: "LOGIN_SUCCESS",
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })
  ]);
  const userOverview = users.map(toUserOverview);

  return {
    summary: {
      totalUsers: users.length,
      admins: users.filter((user) => user.role === "ADMIN").length,
      blockedUsers: users.filter((user) => user.status === "BLOCKED").length,
      verifiedUsers: users.filter((user) => Boolean(user.emailVerifiedAt)).length,
      activeSessions: userOverview.reduce((total, user) => total + user.activeSessions, 0),
      loginsLast7Days
    },
    users: userOverview,
    recentEvents: recentEvents.map(toAccessLogEntry)
  };
}

export async function updateUserAccess(
  userId: string,
  payload: unknown,
  request?: Request
): Promise<AccessUserOverview> {
  const raw = payload as Partial<{
    name: string | null;
    role: AccessUserRole;
    status: AccessUserStatus;
  }>;
  const existing = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!existing) {
    throw new Error("Usuario nao encontrado.");
  }

  const nextRole = raw.role === "ADMIN" || raw.role === "USER" ? raw.role : existing.role;
  const nextStatus = raw.status === "ACTIVE" || raw.status === "BLOCKED" ? raw.status : existing.status;

  if (existing.role === "ADMIN" && (nextRole !== "ADMIN" || nextStatus === "BLOCKED")) {
    const activeAdmins = await prisma.user.count({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
        id: { not: userId }
      }
    });

    if (activeAdmins === 0) {
      throw new Error("Mantenha pelo menos um administrador ativo.");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: raw.name === undefined ? undefined : normalizeText(String(raw.name || "")) || null,
      role: nextRole,
      status: nextStatus
    },
    include: {
      sessions: true,
      diagnostics: { select: { id: true } },
      magicLinks: { select: { id: true } },
      accessLogs: {
        select: { id: true, type: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  });

  if (nextStatus === "BLOCKED") {
    await prisma.userSession.deleteMany({
      where: { userId }
    });
  }

  await recordAccessEvent({
    userId,
    email: user.email,
    type: "ADMIN_UPDATED_USER",
    request,
    metadata: {
      role: nextRole,
      status: nextStatus
    }
  });

  return toUserOverview(user);
}

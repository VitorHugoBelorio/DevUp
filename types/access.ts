export type AccessUserRole = "USER" | "ADMIN";
export type AccessUserStatus = "ACTIVE" | "BLOCKED";

export type AccessEventType =
  | "MAGIC_LINK_REQUESTED"
  | "MAGIC_LINK_SENT"
  | "LOGIN_SUCCESS"
  | "LOGIN_BLOCKED"
  | "LOGOUT"
  | "ADMIN_UPDATED_USER";

export type AccessUserOverview = {
  id: string;
  name: string | null;
  email: string;
  role: AccessUserRole;
  status: AccessUserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  activeSessions: number;
  diagnosticsCount: number;
  magicLinksCount: number;
  accessEventsCount: number;
  lastAccessAt: string | null;
  lastLoginAt: string | null;
};

export type AccessLogEntry = {
  id: string;
  userId: string | null;
  userName: string | null;
  email: string | null;
  type: AccessEventType;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AccessDashboardReport = {
  summary: {
    totalUsers: number;
    admins: number;
    blockedUsers: number;
    verifiedUsers: number;
    activeSessions: number;
    loginsLast7Days: number;
  };
  users: AccessUserOverview[];
  recentEvents: AccessLogEntry[];
};

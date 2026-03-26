export type Role = "admin" | "manager" | "agent" | "customer";
export type UserStatus = "active" | "suspended" | "banned";

export type Permission =
  | "dashboard.view"
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.suspend"
  | "users.ban"
  | "permissions.view"
  | "permissions.assign"
  | "leads.view"
  | "tasks.view"
  | "reports.view"
  | "audit.view"
  | "settings.view"
  | "customer_portal.view";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  managerId: string | null;
  createdBy: string | null;
  passwordHash: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  refreshToken: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorUserId: string;
  actorEmail: string;
  action: string;
  targetUserId: string | null;
  details: string;
  createdAt: string;
}

export interface LeadRecord {
  id: string;
  company: string;
  contact: string;
  stage: string;
  ownerUserId: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  clientName: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Backlog" | "In progress" | "Review" | "Done";
  dueDate: string;
  ownerUserId: string;
}

export interface ReportRecord {
  id: string;
  title: string;
  summary: string;
  visibility: "team" | "management";
}

export interface CustomerPortalRecord {
  id: string;
  customerUserId: string;
  orderRef: string;
  status: string;
  updatedAt: string;
}

export interface StoreData {
  users: UserRecord[];
  sessions: SessionRecord[];
  auditLogs: AuditLogRecord[];
  leads: LeadRecord[];
  tasks: TaskRecord[];
  reports: ReportRecord[];
  customerPortal: CustomerPortalRecord[];
}

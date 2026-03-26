import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { v4 as uuid } from "uuid";
import { DATABASE_URL } from "./config.js";
import { ROLE_DEFAULT_PERMISSIONS } from "./permissions.js";
import type {
  AuditLogRecord,
  CustomerPortalRecord,
  LeadRecord,
  Permission,
  PasswordResetTokenRecord,
  ReportRecord,
  Role,
  SessionRecord,
  TaskRecord,
  UserRecord,
  UserStatus,
} from "./types.js";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

function mapUser(row: Record<string, unknown>): UserRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role as Role,
    status: row.status as UserStatus,
    managerId: row.manager_id ? String(row.manager_id) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    passwordHash: String(row.password_hash),
    permissions: (row.permissions as Permission[]) ?? [],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapSession(row: Record<string, unknown>): SessionRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    refreshToken: String(row.refresh_token),
    expiresAt: new Date(String(row.expires_at)).toISOString(),
    revokedAt: row.revoked_at ? new Date(String(row.revoked_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapAuditLog(row: Record<string, unknown>): AuditLogRecord {
  return {
    id: String(row.id),
    actorUserId: String(row.actor_user_id),
    actorEmail: String(row.actor_email),
    action: String(row.action),
    targetUserId: row.target_user_id ? String(row.target_user_id) : null,
    details: String(row.details),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function now() {
  return new Date().toISOString();
}

async function seedDatabase() {
  const existing = await pool.query("select count(*)::int as count from users");
  if (existing.rows[0].count > 0) return;

  const adminId = uuid();
  const managerId = uuid();
  const agentId = uuid();
  const customerId = uuid();
  const timestamp = now();

  const users = [
    {
      id: adminId,
      name: "Olivia Admin",
      email: "admin@obliq.app",
      role: "admin" as Role,
      managerId: null,
      createdBy: null,
      passwordHash: await bcrypt.hash("Admin123!", 10),
      permissions: ROLE_DEFAULT_PERMISSIONS.admin,
    },
    {
      id: managerId,
      name: "Marcus Manager",
      email: "manager@obliq.app",
      role: "manager" as Role,
      managerId: null,
      createdBy: adminId,
      passwordHash: await bcrypt.hash("Manager123!", 10),
      permissions: ROLE_DEFAULT_PERMISSIONS.manager,
    },
    {
      id: agentId,
      name: "Avery Agent",
      email: "agent@obliq.app",
      role: "agent" as Role,
      managerId,
      createdBy: managerId,
      passwordHash: await bcrypt.hash("Agent123!", 10),
      permissions: ROLE_DEFAULT_PERMISSIONS.agent,
    },
    {
      id: customerId,
      name: "Casey Customer",
      email: "customer@obliq.app",
      role: "customer" as Role,
      managerId,
      createdBy: managerId,
      passwordHash: await bcrypt.hash("Customer123!", 10),
      permissions: ROLE_DEFAULT_PERMISSIONS.customer,
    },
  ];

  for (const user of users) {
    await pool.query(
      `insert into users (
        id, name, email, role, status, manager_id, created_by, password_hash, permissions, created_at, updated_at
      ) values ($1,$2,$3,$4,'active',$5,$6,$7,$8,$9,$9)`,
      [user.id, user.name, user.email, user.role, user.managerId, user.createdBy, user.passwordHash, user.permissions, timestamp],
    );
  }

  const leadSeeds = [
    ["Bluestone", "Omar Rahman", "Qualified", agentId],
    ["Tech Ltd.", "Jabed Ali", "Proposal", agentId],
    ["Northwind", "Sara Islam", "Won", managerId],
  ];
  for (const [company, contact, stage, ownerUserId] of leadSeeds) {
    await pool.query("insert into leads (id, company, contact, stage, owner_user_id) values ($1,$2,$3,$4,$5)", [
      uuid(),
      company,
      contact,
      stage,
      ownerUserId,
    ]);
  }

  const taskSeeds = [
    ["Call about proposal", "Bluestone", "Urgent", "Backlog", "2026-07-18", agentId],
    ["Send onboarding docs", "Tech Ltd.", "High", "In progress", "2026-07-17", agentId],
    ["Prepare pitch deck", "Jabed Ali", "Medium", "Review", "2026-07-14", managerId],
  ];
  for (const [title, clientName, priority, status, dueDate, ownerUserId] of taskSeeds) {
    await pool.query(
      "insert into tasks (id, title, client_name, priority, status, due_date, owner_user_id) values ($1,$2,$3,$4,$5,$6,$7)",
      [uuid(), title, clientName, priority, status, dueDate, ownerUserId],
    );
  }

  await pool.query("insert into reports (id, title, summary, visibility) values ($1,$2,$3,$4), ($5,$6,$7,$8)", [
    uuid(),
    "Weekly pipeline",
    "Qualified leads up 12% week over week.",
    "team",
    uuid(),
    "Permission changes",
    "3 users updated, 1 suspension, 0 bans.",
    "management",
  ]);

  await pool.query("insert into customer_portal (id, customer_user_id, order_ref, status, updated_at) values ($1,$2,$3,$4,$5)", [
    uuid(),
    customerId,
    "ORD-1024",
    "In review",
    timestamp,
  ]);
}

export async function initDatabase() {
  await pool.query(`
    create table if not exists users (
      id uuid primary key,
      name text not null,
      email text unique not null,
      role text not null,
      status text not null,
      manager_id uuid null,
      created_by uuid null,
      password_hash text not null,
      permissions text[] not null default '{}',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists sessions (
      id uuid primary key,
      user_id uuid not null references users(id) on delete cascade,
      refresh_token text not null,
      expires_at timestamptz not null,
      revoked_at timestamptz null,
      created_at timestamptz not null default now()
    );

    create table if not exists password_reset_tokens (
      id uuid primary key,
      user_id uuid not null references users(id) on delete cascade,
      token text not null unique,
      expires_at timestamptz not null,
      used_at timestamptz null,
      created_at timestamptz not null default now()
    );

    create table if not exists audit_logs (
      id uuid primary key,
      actor_user_id uuid not null references users(id) on delete cascade,
      actor_email text not null,
      action text not null,
      target_user_id uuid null,
      details text not null,
      created_at timestamptz not null default now()
    );

    create table if not exists leads (
      id uuid primary key,
      company text not null,
      contact text not null,
      stage text not null,
      owner_user_id uuid not null references users(id) on delete cascade
    );

    create table if not exists tasks (
      id uuid primary key,
      title text not null,
      client_name text not null,
      priority text not null,
      status text not null,
      due_date date not null,
      owner_user_id uuid not null references users(id) on delete cascade
    );

    create table if not exists reports (
      id uuid primary key,
      title text not null,
      summary text not null,
      visibility text not null
    );

    create table if not exists customer_portal (
      id uuid primary key,
      customer_user_id uuid not null references users(id) on delete cascade,
      order_ref text not null,
      status text not null,
      updated_at timestamptz not null
    );
  `);

  await seedDatabase();
}

export async function getUserByEmail(email: string) {
  const result = await pool.query("select * from users where lower(email) = lower($1) limit 1", [email]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function getUserById(id: string) {
  const result = await pool.query("select * from users where id = $1 limit 1", [id]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function createSession(session: SessionRecord) {
  await pool.query(
    "insert into sessions (id, user_id, refresh_token, expires_at, revoked_at, created_at) values ($1,$2,$3,$4,$5,$6)",
    [session.id, session.userId, session.refreshToken, session.expiresAt, session.revokedAt, session.createdAt],
  );
}

export async function getSessionByToken(refreshToken: string) {
  const result = await pool.query("select * from sessions where refresh_token = $1 limit 1", [refreshToken]);
  return result.rows[0] ? mapSession(result.rows[0]) : null;
}

export async function getSessionById(id: string) {
  const result = await pool.query("select * from sessions where id = $1 limit 1", [id]);
  return result.rows[0] ? mapSession(result.rows[0]) : null;
}

export async function revokeSession(id: string) {
  await pool.query("update sessions set revoked_at = now() where id = $1", [id]);
}

export async function revokeAllSessionsForUser(userId: string) {
  await pool.query("update sessions set revoked_at = now() where user_id = $1 and revoked_at is null", [userId]);
}

export async function listUsersForActor(actor: UserRecord) {
  if (actor.role === "admin") {
    const result = await pool.query("select * from users order by created_at desc");
    return result.rows.map(mapUser);
  }

  if (actor.role === "manager") {
    const result = await pool.query(
      "select * from users where id = $1 or manager_id = $1 or created_by = $1 order by created_at desc",
      [actor.id],
    );
    return result.rows.map(mapUser);
  }

  return [actor];
}

export async function createUser(user: UserRecord) {
  await pool.query(
    `insert into users (
      id, name, email, role, status, manager_id, created_by, password_hash, permissions, created_at, updated_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [
      user.id,
      user.name,
      user.email,
      user.role,
      user.status,
      user.managerId,
      user.createdBy,
      user.passwordHash,
      user.permissions,
      user.createdAt,
      user.updatedAt,
    ],
  );
}

export async function updateUserPassword(id: string, passwordHash: string) {
  await pool.query("update users set password_hash = $2, updated_at = now() where id = $1", [id, passwordHash]);
}

export async function updateUserBasics(id: string, values: { name: string; role: Role }) {
  const result = await pool.query(
    "update users set name = $2, role = $3, updated_at = now() where id = $1 returning *",
    [id, values.name, values.role],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function updateUserStatus(id: string, status: UserStatus) {
  const result = await pool.query("update users set status = $2, updated_at = now() where id = $1 returning *", [id, status]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function updateUserPermissions(id: string, permissions: Permission[]) {
  const result = await pool.query("update users set permissions = $2, updated_at = now() where id = $1 returning *", [id, permissions]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function insertAuditLog(log: AuditLogRecord) {
  await pool.query(
    "insert into audit_logs (id, actor_user_id, actor_email, action, target_user_id, details, created_at) values ($1,$2,$3,$4,$5,$6,$7)",
    [log.id, log.actorUserId, log.actorEmail, log.action, log.targetUserId, log.details, log.createdAt],
  );
}

export async function listAuditLogs() {
  const result = await pool.query("select * from audit_logs order by created_at desc");
  return result.rows.map(mapAuditLog);
}

export async function listLeadsForUser(user: UserRecord) {
  const result =
    user.role === "admin" || user.role === "manager"
      ? await pool.query("select * from leads order by company asc")
      : await pool.query("select * from leads where owner_user_id = $1 order by company asc", [user.id]);
  return result.rows.map(
    (row): LeadRecord => ({
      id: String(row.id),
      company: String(row.company),
      contact: String(row.contact),
      stage: String(row.stage),
      ownerUserId: String(row.owner_user_id),
    }),
  );
}

export async function listTasksForUser(user: UserRecord) {
  const result =
    user.role === "admin" || user.role === "manager"
      ? await pool.query("select * from tasks order by due_date asc")
      : await pool.query("select * from tasks where owner_user_id = $1 order by due_date asc", [user.id]);
  return result.rows.map(
    (row): TaskRecord => ({
      id: String(row.id),
      title: String(row.title),
      clientName: String(row.client_name),
      priority: row.priority as TaskRecord["priority"],
      status: row.status as TaskRecord["status"],
      dueDate: String(row.due_date),
      ownerUserId: String(row.owner_user_id),
    }),
  );
}

export async function listReportsForUser(user: UserRecord) {
  const result =
    user.role === "admin" || user.role === "manager"
      ? await pool.query("select * from reports order by title asc")
      : await pool.query("select * from reports where visibility = 'team' order by title asc");
  return result.rows.map(
    (row): ReportRecord => ({
      id: String(row.id),
      title: String(row.title),
      summary: String(row.summary),
      visibility: row.visibility as ReportRecord["visibility"],
    }),
  );
}

export async function listCustomerPortalForUser(user: UserRecord) {
  const result =
    user.role === "customer"
      ? await pool.query("select * from customer_portal where customer_user_id = $1 order by updated_at desc", [user.id])
      : await pool.query("select * from customer_portal order by updated_at desc");
  return result.rows.map(
    (row): CustomerPortalRecord => ({
      id: String(row.id),
      customerUserId: String(row.customer_user_id),
      orderRef: String(row.order_ref),
      status: String(row.status),
      updatedAt: new Date(String(row.updated_at)).toISOString(),
    }),
  );
}

function mapPasswordResetToken(row: Record<string, unknown>): PasswordResetTokenRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    token: String(row.token),
    expiresAt: new Date(String(row.expires_at)).toISOString(),
    usedAt: row.used_at ? new Date(String(row.used_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function createPasswordResetToken(record: PasswordResetTokenRecord) {
  await pool.query(
    "insert into password_reset_tokens (id, user_id, token, expires_at, used_at, created_at) values ($1,$2,$3,$4,$5,$6)",
    [record.id, record.userId, record.token, record.expiresAt, record.usedAt, record.createdAt],
  );
}

export async function getPasswordResetToken(token: string) {
  const result = await pool.query("select * from password_reset_tokens where token = $1 limit 1", [token]);
  return result.rows[0] ? mapPasswordResetToken(result.rows[0]) : null;
}

export async function markPasswordResetTokenUsed(id: string) {
  await pool.query("update password_reset_tokens set used_at = now() where id = $1", [id]);
}

export async function getCounts() {
  const [users, leads, tasks, reports] = await Promise.all([
    pool.query("select count(*)::int as count from users"),
    pool.query("select count(*)::int as count from leads"),
    pool.query("select count(*)::int as count from tasks"),
    pool.query("select count(*)::int as count from reports"),
  ]);
  return {
    users: users.rows[0].count as number,
    leads: leads.rows[0].count as number,
    tasks: tasks.rows[0].count as number,
    reports: reports.rows[0].count as number,
  };
}

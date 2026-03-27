import { v4 as uuid } from "uuid";
import { insertAuditLog } from "../db.js";
import type { UserRecord } from "../types.js";

export async function appendAudit(actor: UserRecord, action: string, targetUserId: string | null, details: string) {
  await insertAuditLog({
    id: uuid(),
    actorUserId: actor.id,
    actorEmail: actor.email,
    action,
    targetUserId,
    details,
    createdAt: new Date().toISOString(),
  });
}

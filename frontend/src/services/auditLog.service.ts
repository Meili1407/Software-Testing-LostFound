import { apiRequest } from "./api";
import type { AuditAction, AuditLogEntry } from "../types/auditLog";

export function listAuditLogs(action?: AuditAction) {
  const qs = action ? `?action=${action}` : "";
  return apiRequest<AuditLogEntry[]>(`/audit-logs${qs}`);
}

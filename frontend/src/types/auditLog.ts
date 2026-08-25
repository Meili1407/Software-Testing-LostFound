export type AuditAction = "REPORT_CREATED" | "CLAIM_SUBMITTED" | "CLAIM_DECIDED" | "HANDOVER_COMPLETED";

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  actor?: { id: string; displayName: string; email: string } | null;
  claim?: { id: string; status: string } | null;
}

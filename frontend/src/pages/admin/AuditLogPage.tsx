import { useEffect, useState } from "react";
import { listAuditLogs } from "../../services/auditLog.service";
import type { AuditAction, AuditLogEntry } from "../../types/auditLog";
import { formatDate } from "../../utils/formatDate";

const ACTIONS: AuditAction[] = ["REPORT_CREATED", "CLAIM_SUBMITTED", "CLAIM_DECIDED", "HANDOVER_COMPLETED"];

function summarize(entry: AuditLogEntry): string {
  const m = entry.metadata ?? {};
  switch (entry.action) {
    case "REPORT_CREATED":
      return `reportType: ${m.reportType ?? "-"}`;
    case "CLAIM_SUBMITTED":
      return `matchScore: ${m.matchScore ?? "-"}`;
    case "CLAIM_DECIDED":
      return `action: ${m.action ?? "-"}, status: ${m.status ?? "-"}`;
    case "HANDOVER_COMPLETED":
      return `verifiedIdentity: ${String(m.verifiedIdentity ?? "-")}`;
    default:
      return JSON.stringify(m);
  }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [action, setAction] = useState<AuditAction | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listAuditLogs(action || undefined)
      .then(setLogs)
      .catch(() => setError("Admin access required to view the audit log."))
      .finally(() => setLoading(false));
  }, [action]);

  return (
    <div className="container">
      <h1>Audit Log</h1>
      <p className="muted">Every report creation, claim submission, claim decision, and handover — admin-only.</p>

      <div className="field" style={{ maxWidth: 240 }}>
        <label>Filter by action</label>
        <select value={action} onChange={(e) => setAction(e.target.value as AuditAction | "")}>
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="empty">Loading…</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {!loading && !error && logs.length === 0 && <p className="empty">No audit log entries yet.</p>}

      {!loading && !error && logs.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Claim</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>
                  <span className={`badge badge-${log.action}`}>{log.action.replace(/_/g, " ")}</span>
                </td>
                <td>{log.actor?.displayName ?? "-"}</td>
                <td>{log.claim ? <span className={`badge badge-${log.claim.status}`}>{log.claim.status}</span> : "-"}</td>
                <td className="muted">{summarize(log)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

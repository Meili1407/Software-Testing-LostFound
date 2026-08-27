import { Link } from "react-router-dom";
import type { Claim } from "../../../types/claim";
import { StatusBadge } from "../../../components/StatusBadge";

export function RecentClaims({ claims }: { claims: Claim[] }) {
  if (claims.length === 0) {
    return <p className="empty">No claims submitted yet.</p>;
  }

  return (
    <div>
      {claims.map((c) => (
        <div key={c.id} className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>{c.lostReport.title}</div>
            <div className="muted">
              {c.code} · Match score: {c.matchScore}/100
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusBadge value={c.status} />
            <Link className="btn" to={`/claims/track?code=${c.code}`}>
              Details
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

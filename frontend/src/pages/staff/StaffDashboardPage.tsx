import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listClaims } from "../../services/claim.service";
import type { Claim } from "../../types/claim";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../utils/formatDate";

export default function StaffDashboardPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listClaims()
      .then(setClaims)
      .catch(() => setError("Staff access required to view claims."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1>Staff Dashboard</h1>
        <Link className="btn btn-primary" to="/staff/report-found">
          Report Found Item
        </Link>
      </div>

      <h2>Claims Awaiting Review</h2>
      {loading && <p className="empty">Loading…</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {!loading && !error && claims.length === 0 && <p className="empty">No claims yet.</p>}

      {claims.map((c) => (
        <div key={c.id} className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>
              {c.code} — {c.lostReport.title}
            </div>
            <div className="muted">
              {c.claimant.displayName} · {formatDate(c.createdAt)} · Score {c.matchScore}/100
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusBadge value={c.status} />
            <Link className="btn" to={`/staff/claims/${c.id}`}>
              Review
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

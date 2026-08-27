import { Link } from "react-router-dom";

export function QuickActions() {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
      <Link className="btn btn-primary" to="/student/report-lost">
        Report Lost Item
      </Link>
      <Link className="btn" to="/found-items">
        Browse Found Items
      </Link>
      <Link className="btn" to="/claims/track">
        Track a Claim
      </Link>
    </div>
  );
}

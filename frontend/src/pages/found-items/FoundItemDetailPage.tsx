import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listReports } from "../../services/item.service";
import type { ItemReport } from "../../types/item";
import { StatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../utils/formatDate";
import { resolveAssetUrl } from "../../services/api";

export default function FoundItemDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState<ItemReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listReports()
      .then((reports) => setReport(reports.find((r) => r.id === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container">Loading…</div>;
  if (!report) return <div className="container">Report not found.</div>;

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <Link className="muted" to="/found-items">
        ← Back to Found Items
      </Link>
      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h1 style={{ marginTop: 0 }}>{report.title}</h1>
          <StatusBadge value={report.status} />
        </div>
        {resolveAssetUrl(report.photoUrl) && (
          <img
            src={resolveAssetUrl(report.photoUrl)}
            alt={report.title}
            style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 10, marginBottom: 12 }}
          />
        )}
        <p>{report.description}</p>
        <table>
          <tbody>
            <tr>
              <th>Category</th>
              <td>{report.category?.name ?? "-"}</td>
            </tr>
            <tr>
              <th>Color</th>
              <td>{report.color ?? "-"}</td>
            </tr>
            <tr>
              <th>Brand</th>
              <td>{report.brand ?? "-"}</td>
            </tr>
            <tr>
              <th>Location</th>
              <td>{report.location}</td>
            </tr>
            <tr>
              <th>Date found</th>
              <td>{formatDate(report.occurredAt)}</td>
            </tr>
          </tbody>
        </table>

        <Link className="btn btn-primary" to={`/claims/submit?foundReportId=${report.id}`} style={{ marginTop: 16, display: "inline-block" }}>
          This looks like mine — Submit a Claim
        </Link>
      </div>
    </div>
  );
}

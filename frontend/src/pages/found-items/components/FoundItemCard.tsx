import { Link } from "react-router-dom";
import type { ItemReport } from "../../../types/item";
import { StatusBadge } from "../../../components/StatusBadge";
import { formatDate } from "../../../utils/formatDate";
import { resolveAssetUrl } from "../../../services/api";

export function FoundItemCard({ report }: { report: ItemReport }) {
  const photoUrl = resolveAssetUrl(report.photoUrl);
  return (
    <Link className="item-card" to={`/found-items/${report.id}`}>
      <div
        className="item-card-img"
        style={photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <span>{report.category ? report.category.name : "Item"}</span>
      </div>
      <div className="item-card-body">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span className="item-card-cat">{report.category ? report.category.name : ""}</span>
          <StatusBadge value={report.status} />
        </div>
        <div className="item-card-title">{report.title}</div>
        <div className="item-card-loc">📍 {report.location}</div>
        <div className="item-card-date">{formatDate(report.occurredAt)}</div>
      </div>
    </Link>
  );
}

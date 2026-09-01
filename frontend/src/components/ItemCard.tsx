import { Link } from "react-router-dom";
import type { ItemReport } from "../types/item";
import { formatDate } from "../utils/formatDate";
import { resolveAssetUrl } from "../services/api";

interface ItemCardProps {
  report: ItemReport;
  to?: string;
}

export function ItemCard({ report, to }: ItemCardProps) {
  const photoUrl = resolveAssetUrl(report.photoUrl);
  const content = (
    <>
      <div
        className="item-card-img"
        style={photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <span>{report.category ? report.category.name : "Item"}</span>
      </div>
      <div className="item-card-body">
        <div className="item-card-cat">{report.category ? report.category.name : ""}</div>
        <div className="item-card-title">{report.title}</div>
        <div className="item-card-loc">📍 {report.location}</div>
        <div className="item-card-date">{formatDate(report.occurredAt)}</div>
      </div>
    </>
  );

  if (to) {
    return (
      <Link className="item-card" to={to}>
        {content}
      </Link>
    );
  }

  return <div className="item-card">{content}</div>;
}

import { Link } from "react-router-dom";
import type { ItemReport } from "../../../types/item";
import type { MatchResult } from "../../../types/match";
import { StatusBadge } from "../../../components/StatusBadge";
import { formatDate } from "../../../utils/formatDate";

export interface MatchSummary {
  count: number;
  bestScore: number;
  bestResult: MatchResult;
}

function MatchSummaryBadge({
  reportId,
  summary,
  loading,
}: {
  reportId: string;
  summary?: MatchSummary;
  loading: boolean;
}) {
  if (loading) return <span className="muted" style={{ fontSize: 13 }}>Checking matches…</span>;
  if (!summary || summary.count === 0) {
    return <span className="muted" style={{ fontSize: 13 }}>No matches yet</span>;
  }
  return (
    <Link to={`/matches/${reportId}`} style={{ fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
      {summary.count} match{summary.count === 1 ? "" : "es"} · best {summary.bestScore}/100
    </Link>
  );
}

export function LostReportCard({ report, matchSummary }: { report: ItemReport; matchSummary?: MatchSummary }) {
  return (
    <div className="card" style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontWeight: 700 }}>{report.title}</div>
        <div className="muted">
          {report.location} · {formatDate(report.occurredAt)}
        </div>
        {report.status === "OPEN" && (
          <div style={{ marginTop: 4 }}>
            <MatchSummaryBadge reportId={report.id} summary={matchSummary} loading={!matchSummary} />
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <StatusBadge value={report.status} />
        <Link className="btn" to={`/matches/${report.id}`}>
          View Matches
        </Link>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMatchesForReport } from "../../services/matching.service";
import type { MatchCandidate } from "../../types/match";
import { MatchCard } from "./components/MatchCard";

export default function MatchResultsPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    getMatchesForReport(reportId)
      .then(setMatches)
      .catch(() => setError("Could not load matches for this report."))
      .finally(() => setLoading(false));
  }, [reportId]);

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>Match Results</h1>
      <p className="muted">Found items compared against your lost report, sorted by match score.</p>

      {loading && <p className="empty">Loading matches…</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {!loading && !error && matches.length === 0 && <p className="empty">No open matches found yet.</p>}

      {reportId &&
        matches.map((m) => (
          <MatchCard
            key={m.report.id}
            candidate={m}
            lostReportId={reportId}
            onDismissed={(foundReportId) =>
              setMatches((prev) => prev.filter((match) => match.report.id !== foundReportId))
            }
          />
        ))}
    </div>
  );
}

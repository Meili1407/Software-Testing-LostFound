import { useState } from "react";
import { Link } from "react-router-dom";
import type { MatchCandidate, MatchDecisionType } from "../../../types/match";
import { formatDate } from "../../../utils/formatDate";
import { decideMatch } from "../../../services/matching.service";
import { ApiError } from "../../../services/api";
import { Button } from "../../../components/Button";
import { MatchScore } from "./MatchScore";
import { ScoreBreakdown } from "./ScoreBreakdown";

interface MatchCardProps {
  candidate: MatchCandidate;
  lostReportId: string;
  onDismissed?: (foundReportId: string) => void;
}

export function MatchCard({ candidate, lostReportId, onDismissed }: MatchCardProps) {
  const { report, score, result, breakdown, matchDecision } = candidate;
  const [decision, setDecision] = useState<MatchDecisionType | null>(matchDecision);
  const [submitting, setSubmitting] = useState<MatchDecisionType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(next: MatchDecisionType) {
    setError(null);
    setSubmitting(next);
    try {
      await decideMatch({ lostReportId, foundReportId: report.id, decision: next });
      setDecision(next);
      if (next === "DISMISSED") onDismissed?.(report.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update match.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="card" style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{report.title}</div>
        <div className="muted">
          {report.location} · {formatDate(report.occurredAt)}
        </div>
        <ScoreBreakdown breakdown={breakdown} />

        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {decision === "CONFIRMED" ? (
            <span className="badge badge-APPROVED">Confirmed match</span>
          ) : (
            <Button disabled={submitting !== null} onClick={() => act("CONFIRMED")}>
              {submitting === "CONFIRMED" ? "Confirming…" : "This is a match"}
            </Button>
          )}
          {decision !== "DISMISSED" && (
            <Button disabled={submitting !== null} onClick={() => act("DISMISSED")}>
              {submitting === "DISMISSED" ? "Dismissing…" : "Not a match"}
            </Button>
          )}
          <Link className="btn btn-primary" to={`/claims/submit?lostReportId=${lostReportId}&foundReportId=${report.id}`}>
            Submit a Claim
          </Link>
        </div>
      </div>
      <MatchScore score={score} result={result} />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listReports } from "../../services/item.service";
import { listClaims } from "../../services/claim.service";
import { getMatchesForReport } from "../../services/matching.service";
import type { ItemReport } from "../../types/item";
import type { Claim } from "../../types/claim";
import type { MatchResult } from "../../types/match";
import { QuickActions } from "./components/QuickActions";
import { LostReportCard, type MatchSummary } from "./components/LostReportCard";
import { RecentClaims } from "./components/RecentClaims";

export default function StudentHomePage() {
  const { actor } = useAuth();
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [matchSummaries, setMatchSummaries] = useState<Record<string, MatchSummary>>({});

  useEffect(() => {
    if (!actor) return;
    listReports({ reportType: "LOST" }).then(setReports).catch(() => setReports([]));
    listClaims().then(setClaims).catch(() => setClaims([]));
  }, [actor]);

  const myReports = useMemo(
    () => reports.filter((r) => r.createdBy?.id === actor?.id),
    [reports, actor]
  );

  const openReportIds = useMemo(
    () => myReports.filter((r) => r.status === "OPEN").map((r) => r.id),
    [myReports]
  );

  useEffect(() => {
    if (openReportIds.length === 0) return;
    let cancelled = false;

    Promise.all(
      openReportIds.map((id) =>
        getMatchesForReport(id)
          .then((matches) => [id, matches] as const)
          .catch(() => [id, []] as const)
      )
    ).then((results) => {
      if (cancelled) return;
      setMatchSummaries((prev) => {
        const next = { ...prev };
        for (const [id, matches] of results) {
          next[id] = {
            count: matches.length,
            bestScore: matches[0]?.score ?? 0,
            bestResult: (matches[0]?.result ?? "WEAK_MATCH") as MatchResult,
          };
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [openReportIds]);

  if (!actor) return <div className="container">Loading…</div>;

  const myClaims = claims.filter((c) => c.claimant.id === actor.id).slice(0, 5);

  return (
    <div className="container">
      <h1>Welcome back, {actor.displayName}</h1>
      <p className="muted">Quick access to your lost reports, found items, and claims.</p>

      <QuickActions />

      <div className="grid">
        <div>
          <h2>Your Lost Reports</h2>
          {myReports.length === 0 ? (
            <p className="empty">You haven't reported any lost items yet.</p>
          ) : (
            myReports.map((r) => (
              <LostReportCard key={r.id} report={r} matchSummary={matchSummaries[r.id]} />
            ))
          )}
        </div>
        <div>
          <h2>Recent Claims</h2>
          <RecentClaims claims={myClaims} />
        </div>
      </div>
    </div>
  );
}

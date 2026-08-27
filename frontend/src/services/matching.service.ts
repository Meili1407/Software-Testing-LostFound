import { apiRequest } from "./api";
import type { MatchCandidate, MatchDecisionType } from "../types/match";

export function getMatchesForReport(reportId: string) {
  return apiRequest<MatchCandidate[]>(`/reports/${reportId}/matches`);
}

export function decideMatch(input: {
  lostReportId: string;
  foundReportId: string;
  decision: MatchDecisionType;
}) {
  return apiRequest("/reports/matches/decision", { method: "POST", body: input });
}

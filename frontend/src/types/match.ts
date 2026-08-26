import type { ItemReport } from "./item";

export type MatchResult = "STRONG_MATCH" | "POSSIBLE_MATCH" | "WEAK_MATCH";

export interface MatchBreakdown {
  itemName: number;
  description: number;
  color: number;
  brand: number;
  location: number;
  date: number;
}

export type MatchDecisionType = "CONFIRMED" | "DISMISSED";

export interface MatchCandidate {
  report: ItemReport;
  score: number;
  result: MatchResult;
  breakdown: MatchBreakdown;
  matchDecision: MatchDecisionType | null;
}

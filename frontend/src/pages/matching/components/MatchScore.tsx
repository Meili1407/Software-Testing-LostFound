import type { MatchResult } from "../../../types/match";
import { StatusBadge } from "../../../components/StatusBadge";

export function MatchScore({ score, result }: { score: number; result: MatchResult }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontWeight: 800, fontSize: 20 }}>{score}/100</div>
      <StatusBadge value={result} />
    </div>
  );
}

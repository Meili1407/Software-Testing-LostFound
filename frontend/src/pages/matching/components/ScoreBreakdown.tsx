import type { MatchBreakdown } from "../../../types/match";

const LABELS: Record<keyof MatchBreakdown, string> = {
  itemName: "Item name",
  description: "Description",
  color: "Color",
  brand: "Brand",
  location: "Location",
  date: "Date",
};

export function ScoreBreakdown({ breakdown }: { breakdown: MatchBreakdown }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0", fontSize: 12, color: "var(--muted)" }}>
      {(Object.keys(breakdown) as (keyof MatchBreakdown)[]).map((key) => (
        <li key={key} style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{LABELS[key]}</span>
          <span>{breakdown[key]}</span>
        </li>
      ))}
    </ul>
  );
}

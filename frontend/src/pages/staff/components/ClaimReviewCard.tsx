import type { Claim } from "../../../types/claim";
import { StatusBadge } from "../../../components/StatusBadge";
import { formatDate } from "../../../utils/formatDate";

export function ClaimReviewCard({ claim }: { claim: Claim }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {claim.code} — {claim.lostReport.title}
          </div>
          <div className="muted">
            Claimed by {claim.claimant.displayName} against found report "{claim.foundReport.title}"
          </div>
        </div>
        <StatusBadge value={claim.status} />
      </div>

      <table style={{ marginTop: 12 }}>
        <tbody>
          <tr>
            <th>Match score</th>
            <td>{claim.matchScore}/100</td>
          </tr>
          <tr>
            <th>Submitted</th>
            <td>{formatDate(claim.createdAt)}</td>
          </tr>
          <tr>
            <th>Evidence</th>
            <td>{claim.evidenceDescription}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

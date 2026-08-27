import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getClaim } from "../../services/claim.service";
import type { Claim } from "../../types/claim";
import { ClaimReviewCard } from "./components/ClaimReviewCard";
import { StaffDecisionButtons } from "./components/StaffDecisionButtons";

export default function ClaimReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getClaim(id)
      .then(setClaim)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container">Loading…</div>;
  if (!claim) return <div className="container">Claim not found.</div>;

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>Review Claim</h1>
      <ClaimReviewCard claim={claim} />
      <StaffDecisionButtons claim={claim} onDecided={setClaim} />
    </div>
  );
}

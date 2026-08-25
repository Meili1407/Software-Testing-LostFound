import { useState } from "react";
import { decideClaim, confirmHandover } from "../../../services/claim.service";
import { ApiError } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import type { Claim, ClaimAction } from "../../../types/claim";
import { Button } from "../../../components/Button";

interface StaffDecisionButtonsProps {
  claim: Claim;
  onDecided: (claim: Claim) => void;
}

export function StaffDecisionButtons({ claim, onDecided }: StaffDecisionButtonsProps) {
  const { actor } = useAuth();
  const [staffVerifiedEvidence, setStaffVerifiedEvidence] = useState(false);
  const [verifiedIdentity, setVerifiedIdentity] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canDecide = actor?.role === "STAFF" || actor?.role === "ADMIN";

  async function act(action: ClaimAction) {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await decideClaim(claim.id, { action, staffVerifiedEvidence });
      onDecided(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update claim.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handover() {
    setError(null);
    setSubmitting(true);
    try {
      const updated = await confirmHandover(claim.id, verifiedIdentity);
      onDecided(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to confirm handover.");
    } finally {
      setSubmitting(false);
    }
  }

  if (claim.status === "APPROVED") {
    if (!canDecide) {
      return <p className="muted" style={{ marginTop: 14 }}>Claim approved. Staff will confirm the handover once arranged.</p>;
    }
    return (
      <div style={{ marginTop: 14 }}>
        <p className="muted">Claim approved. Arrange the handover, then confirm below.</p>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 10 }}>
          <input type="checkbox" checked={verifiedIdentity} onChange={(e) => setVerifiedIdentity(e.target.checked)} />
          I verified the claimant's identity in person
        </label>
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        <Button variant="primary" disabled={submitting || !verifiedIdentity} onClick={handover}>
          Confirm Handover
        </Button>
      </div>
    );
  }

  if (claim.status !== "PENDING" && claim.status !== "INFO_REQUESTED") {
    return null;
  }

  if (!canDecide) {
    return (
      <p className="muted" style={{ marginTop: 14 }}>
        Only Lost &amp; Found staff can review and decide this claim.
      </p>
    );
  }

  return (
    <div style={{ marginTop: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 10 }}>
        <input type="checkbox" checked={staffVerifiedEvidence} onChange={(e) => setStaffVerifiedEvidence(e.target.checked)} />
        I have verified this evidence in person
      </label>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <Button variant="primary" disabled={submitting} onClick={() => act("APPROVE")}>
          Approve
        </Button>
        <Button variant="danger" disabled={submitting} onClick={() => act("REJECT")}>
          Reject
        </Button>
        <Button disabled={submitting} onClick={() => act("REQUEST_INFO")}>
          Request More Info
        </Button>
      </div>
    </div>
  );
}

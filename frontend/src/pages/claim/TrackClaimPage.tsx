import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { getClaimByCode } from "../../services/claim.service";
import { ApiError } from "../../services/api";
import type { Claim } from "../../types/claim";
import { ClaimStatus } from "./components/ClaimStatus";

export default function TrackClaimPage() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") ?? "");
  const [claim, setClaim] = useState<Claim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(value: string) {
    if (!value) return;
    setLoading(true);
    setError(null);
    setClaim(null);
    try {
      const result = await getClaimByCode(value);
      setClaim(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not find that claim.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (searchParams.get("code")) lookup(searchParams.get("code")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    lookup(code);
  }

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>Track Claim Status</h1>
      <p className="muted">
        Enter your claim code (shown after you submit a claim, e.g. <code>CLM-00001</code>) to
        check its status. Note: the backend still requires you to be signed in as the claimant,
        staff, or admin — a fully public lookup isn't wired up yet.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
          placeholder="CLM-00001"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Checking…" : "Check Status"}
        </button>
      </form>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {claim && <ClaimStatus claim={claim} />}
    </div>
  );
}

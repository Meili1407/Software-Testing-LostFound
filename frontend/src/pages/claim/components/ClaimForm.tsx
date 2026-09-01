import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { listReports } from "../../../services/item.service";
import { submitClaim } from "../../../services/claim.service";
import { ApiError } from "../../../services/api";
import type { ItemReport } from "../../../types/item";
import { Select, TextArea } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { EvidenceUpload } from "./EvidenceUpload";

export function ClaimForm() {
  const navigate = useNavigate();
  const { actor } = useAuth();
  const [searchParams] = useSearchParams();

  const [lostReports, setLostReports] = useState<ItemReport[]>([]);
  const [foundReports, setFoundReports] = useState<ItemReport[]>([]);
  const [lostReportId, setLostReportId] = useState(searchParams.get("lostReportId") ?? "");
  const [foundReportId, setFoundReportId] = useState(searchParams.get("foundReportId") ?? "");
  const [evidenceDescription, setEvidenceDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!actor) return;
    listReports({ reportType: "LOST" }).then((reports) => {
      const mine = reports.filter((r) => r.createdBy?.id === actor.id);
      setLostReports(mine);
      if (!lostReportId && mine.length > 0) setLostReportId(mine[0].id);
    });
    listReports({ reportType: "FOUND" }).then((reports) => {
      setFoundReports(reports);
      if (!foundReportId && reports.length > 0) setFoundReportId(reports[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const claim = await submitClaim({ lostReportId, foundReportId, evidenceDescription });
      navigate(`/claims/track?code=${claim.code}`);
    } catch (err) {
      const message = err instanceof ApiError ? [err.message, ...(err.details ?? [])].join(" — ") : "Failed to submit claim.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <Select label="Your lost report" value={lostReportId} onChange={setLostReportId} required>
        <option value="">-- choose a report --</option>
        {lostReports.map((r) => (
          <option key={r.id} value={r.id}>
            {r.title} — {r.location}
          </option>
        ))}
      </Select>

      <Select label="Found report you're claiming" value={foundReportId} onChange={setFoundReportId} required>
        <option value="">-- choose a report --</option>
        {foundReports.map((r) => (
          <option key={r.id} value={r.id}>
            {r.title} — {r.location}
          </option>
        ))}
      </Select>

      <TextArea
        label="Supporting evidence (min 10 characters)"
        value={evidenceDescription}
        onChange={(e) => setEvidenceDescription(e.target.value)}
        rows={4}
        placeholder="Describe proof of ownership: purchase receipt, unique marks, details only the owner would know..."
        required
        minLength={10}
      />

      <EvidenceUpload />

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <Button type="submit" variant="primary" disabled={submitting || !lostReportId || !foundReportId}>
        {submitting ? "Submitting…" : "Submit Claim"}
      </Button>
    </form>
  );
}

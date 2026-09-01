import { ClaimForm } from "./components/ClaimForm";

export default function SubmitClaimPage() {
  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>Submit a Claim</h1>
      <p className="muted">Enter ownership details and evidence for staff to review.</p>
      <ClaimForm />
    </div>
  );
}

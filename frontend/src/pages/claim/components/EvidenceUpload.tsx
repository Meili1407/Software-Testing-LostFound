export function EvidenceUpload() {
  return (
    <div className="field">
      <label htmlFor="evidence-photos">Photos (optional)</label>
      <input id="evidence-photos" type="file" multiple disabled />
      <p className="muted" style={{ marginTop: 4 }}>
        Photo upload isn't wired to the backend yet — there's no image storage or PDPA-gated
        viewing endpoint. For now, describe distinguishing details in the evidence field below.
      </p>
    </div>
  );
}

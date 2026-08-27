import { LostItemForm } from "./components/LostItemForm";

export default function ReportLostPage() {
  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>Report a Lost Item</h1>
      <p className="muted">Give as much detail as you can — it directly improves your match score.</p>
      <LostItemForm reportType="LOST" />
    </div>
  );
}

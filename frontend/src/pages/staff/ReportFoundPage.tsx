import { FoundItemForm } from "./components/FoundItemForm";

export default function ReportFoundPage() {
  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>Report a Found Item</h1>
      <p className="muted">Log an item handed in to the Lost &amp; Found center.</p>
      <FoundItemForm />
    </div>
  );
}

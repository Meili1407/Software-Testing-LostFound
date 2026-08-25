import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listReports } from "../../services/item.service";
import type { ItemReport, ReportType } from "../../types/item";
import { ItemCard } from "../../components/ItemCard";

export default function HomePage() {
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [reportType, setReportType] = useState<ReportType>("LOST");
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    listReports().then(setReports).catch(() => setReports([]));
  }, []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports
      .filter((r) => r.reportType === reportType && r.status === "OPEN")
      .filter((r) => {
        if (!q) return true;
        const haystack = [r.title, r.location, r.category?.name ?? ""].join(" ").toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  }, [reports, reportType, query]);

  return (
    <div style={{ background: "var(--home-bg)" }}>
      <div className="container">
        <div style={{ marginBottom: 22 }}>
          <span className="item-card-cat">Campus Lost &amp; Found</span>
        </div>

        <h1 style={{ fontSize: 44, fontWeight: 800, color: "var(--home-text)", margin: "0 0 14px" }}>
          Find what you lost.
        </h1>
        <p style={{ color: "var(--home-muted)", maxWidth: 560, marginBottom: 24 }}>
          Browse recently reported items around campus. You can view item details without logging in.
        </p>

        <div
          className="card"
          style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}
        >
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: 220 }}>
              <span className="badge" style={{ background: "var(--home-text)", color: "#fff" }}>1</span>
              <div>
                <div style={{ fontWeight: 700 }}>Report it</div>
                <div className="muted">Lost or found an item — file a report.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: 220 }}>
              <span className="badge" style={{ background: "var(--home-text)", color: "#fff" }}>2</span>
              <div>
                <div style={{ fontWeight: 700 }}>We match it</div>
                <div className="muted">The system scores reports against each other.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", maxWidth: 220 }}>
              <span className="badge" style={{ background: "var(--home-text)", color: "#fff" }}>3</span>
              <div>
                <div style={{ fontWeight: 700 }}>Claim it</div>
                <div className="muted">Submit evidence; staff review and decide.</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" to="/student/report-lost">
              I lost something
            </Link>
            <Link className="btn" to="/staff/report-found">
              I found something
            </Link>
          </div>
        </div>

        <form
          style={{ display: "flex", gap: 10, maxWidth: 720, marginBottom: 32 }}
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(searchInput);
          }}
        >
          <input
            style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border)" }}
            placeholder="Search by item, category, or location..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <span className="item-card-cat">Recently Reported</span>
            <h2 style={{ margin: "4px 0 0" }}>{reportType === "LOST" ? "Lost Items" : "Found Items"}</h2>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="btn"
              style={reportType === "LOST" ? { background: "var(--home-text)", color: "#fff", borderColor: "var(--home-text)" } : {}}
              onClick={() => setReportType("LOST")}
            >
              Lost Items
            </button>
            <button
              type="button"
              className="btn"
              style={reportType === "FOUND" ? { background: "var(--home-text)", color: "#fff", borderColor: "var(--home-text)" } : {}}
              onClick={() => setReportType("FOUND")}
            >
              Found Items
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="empty">No items found.</p>
        ) : (
          <div className="item-grid" style={{ paddingBottom: 40 }}>
            {items.map((r) => (
              <ItemCard key={r.id} report={r} to={reportType === "LOST" ? `/matches/${r.id}` : `/found-items/${r.id}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

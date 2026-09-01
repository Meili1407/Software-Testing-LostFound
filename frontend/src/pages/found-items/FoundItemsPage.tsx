import { useEffect, useMemo, useState } from "react";
import { listCategories, listReports } from "../../services/item.service";
import type { ItemCategory, ItemReport } from "../../types/item";
import { SearchFilter } from "./components/SearchFilter";
import { FoundItemCard } from "./components/FoundItemCard";

export default function FoundItemsPage() {
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    listReports({ reportType: "FOUND" }).then(setReports).catch(() => setReports([]));
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports
      .filter((r) => (categoryId ? r.category?.id === categoryId : true))
      .filter((r) => {
        if (!q) return true;
        const haystack = [r.title, r.description, r.location].join(" ").toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  }, [reports, query, categoryId]);

  return (
    <div className="container">
      <h1>Found Items</h1>
      <p className="muted">Browse items found around campus. If one looks like yours, open it to submit a claim.</p>

      <SearchFilter
        query={query}
        onQueryChange={setQuery}
        categoryId={categoryId}
        onCategoryChange={setCategoryId}
        categories={categories}
      />

      {filtered.length === 0 ? (
        <p className="empty">No found items match your search.</p>
      ) : (
        <div className="item-grid">
          {filtered.map((r) => (
            <FoundItemCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}

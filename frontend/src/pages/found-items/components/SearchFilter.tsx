import type { ItemCategory } from "../../../types/item";

interface SearchFilterProps {
  query: string;
  onQueryChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: ItemCategory[];
}

export function SearchFilter({ query, onQueryChange, categoryId, onCategoryChange, categories }: SearchFilterProps) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
      <input
        style={{ flex: 1, minWidth: 220, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
        placeholder="Search by item, description, or location..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <select
        style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
        value={categoryId}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

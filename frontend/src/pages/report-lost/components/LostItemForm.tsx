import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createReport, listCategories } from "../../../services/item.service";
import type { ItemCategory } from "../../../types/item";
import { ApiError } from "../../../services/api";
import { Input, Select, TextArea } from "../../../components/Input";
import { Button } from "../../../components/Button";

export function LostItemForm({ reportType }: { reportType: "LOST" | "FOUND" }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [location, setLocation] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  useEffect(() => {
    listCategories().then((list) => {
      setCategories(list);
      if (list.length > 0) setCategoryId(list[0].id);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const report = await createReport({
        title,
        description,
        reportType,
        location,
        occurredAt: new Date(occurredAt).toISOString(),
        color: color || undefined,
        brand: brand || undefined,
        categoryId,
        photo,
      });
      navigate(reportType === "LOST" ? `/matches/${report.id}` : "/staff");
    } catch (err) {
      const message = err instanceof ApiError ? [err.message, ...(err.details ?? [])].join(" — ") : "Failed to save report.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="row">
        <Select label="Category" value={categoryId} onChange={setCategoryId} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Black Backpack" required maxLength={120} />
      </div>

      <TextArea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Distinguishing details, contents, condition..."
        required
      />

      <div className="row">
        <Input label="Color (optional)" value={color} onChange={(e) => setColor(e.target.value)} maxLength={50} />
        <Input label="Brand (optional)" value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={50} />
      </div>

      <div className="row">
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Library 2nd Floor" required maxLength={200} />
        <Input label="Date & time seen" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} required />
      </div>

      <div className="field">
        <label>Photo (optional)</label>
        <input type="file" accept="image/*" onChange={handlePhotoChange} />
        {photoPreview && (
          <img
            src={photoPreview}
            alt="Preview"
            style={{ marginTop: 8, maxWidth: 160, borderRadius: 8, border: "1px solid var(--border)" }}
          />
        )}
      </div>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <Button type="submit" variant="primary" disabled={submitting}>
        {submitting ? "Saving…" : "Save Report"}
      </Button>
    </form>
  );
}

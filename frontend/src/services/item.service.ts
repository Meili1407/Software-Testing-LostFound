import { apiRequest } from "./api";
import type { CreateItemReportInput, ItemCategory, ItemReport } from "../types/item";

export function listReports(params?: { reportType?: "LOST" | "FOUND"; status?: string }) {
  const query = new URLSearchParams();
  if (params?.reportType) query.set("reportType", params.reportType);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return apiRequest<ItemReport[]>(`/reports${qs ? `?${qs}` : ""}`);
}

export function createReport(input: CreateItemReportInput) {
  const { photo, ...fields } = input;

  if (!photo) {
    return apiRequest<ItemReport>("/reports", { method: "POST", body: fields });
  }

  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) formData.append(key, String(value));
  }
  formData.append("photo", photo);

  return apiRequest<ItemReport>("/reports", { method: "POST", body: formData });
}

export function listCategories() {
  return apiRequest<ItemCategory[]>("/categories");
}

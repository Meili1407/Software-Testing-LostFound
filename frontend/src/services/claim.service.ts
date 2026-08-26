import { apiRequest } from "./api";
import type { Claim, ClaimDecisionInput, SubmitClaimInput } from "../types/claim";

export function listClaims(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return apiRequest<Claim[]>(`/claims${qs}`);
}

export function getClaim(id: string) {
  return apiRequest<Claim>(`/claims/${id}`);
}

export function getClaimByCode(code: string) {
  return apiRequest<Claim>(`/claims/by-code/${encodeURIComponent(code)}`);
}

export function submitClaim(input: SubmitClaimInput) {
  return apiRequest<Claim>("/claims", { method: "POST", body: input });
}

export function decideClaim(id: string, input: ClaimDecisionInput) {
  return apiRequest<Claim>(`/claims/${id}/decision`, { method: "PATCH", body: input });
}

export function confirmHandover(id: string, verifiedIdentity: boolean) {
  return apiRequest<Claim>(`/claims/${id}/handover`, { method: "PATCH", body: { verifiedIdentity } });
}

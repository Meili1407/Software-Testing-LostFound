import type { ItemReport, ReportAuthor } from "./item";

export type ClaimStatus = "PENDING" | "APPROVED" | "REJECTED" | "INFO_REQUESTED" | "COMPLETED";

export type ClaimAction = "APPROVE" | "REJECT" | "REQUEST_INFO";

export interface Claim {
  id: string;
  claimNumber: number;
  code: string;
  status: ClaimStatus;
  matchScore: number;
  evidenceDescription: string;
  staffVerifiedEvidence: boolean;
  decisionReason?: string | null;
  handoverVerifiedIdentity: boolean;
  handoverConfirmedAt?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  lostReport: ItemReport;
  foundReport: ItemReport;
  claimant: ReportAuthor;
  decidedBy?: ReportAuthor | null;
}

export interface SubmitClaimInput {
  lostReportId: string;
  foundReportId: string;
  evidenceDescription: string;
}

export interface ClaimDecisionInput {
  action: ClaimAction;
  staffVerifiedEvidence?: boolean;
}

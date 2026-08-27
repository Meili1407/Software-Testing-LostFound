export type NotificationType =
  | "MATCH_CONFIRMED"
  | "CLAIM_APPROVED"
  | "CLAIM_REJECTED"
  | "CLAIM_INFO_REQUESTED"
  | "HANDOVER_READY";

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  reportId?: string | null;
  claimId?: string | null;
}

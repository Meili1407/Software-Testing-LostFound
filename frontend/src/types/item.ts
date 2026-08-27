export type ReportType = "LOST" | "FOUND";

export type ReportStatus =
  | "OPEN"
  | "MATCHED"
  | "CLAIM_IN_PROGRESS"
  | "RESOLVED"
  | "DONATED"
  | "DISPOSED"
  | "ARCHIVED";

export interface ItemCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface ReportAuthor {
  id: string;
  displayName: string;
  email: string;
}

export interface ItemReport {
  id: string;
  title: string;
  description: string;
  reportType: ReportType;
  status: ReportStatus;
  location: string;
  occurredAt: string;
  reportedAt: string;
  color?: string | null;
  brand?: string | null;
  photoUrl?: string | null;
  isPublic: boolean;
  category?: ItemCategory;
  createdBy?: ReportAuthor;
}

export interface CreateItemReportInput {
  title: string;
  description: string;
  reportType: ReportType;
  location: string;
  occurredAt: string;
  color?: string;
  brand?: string;
  categoryId: string;
  photo?: File | null;
}

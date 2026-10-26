export type ReportTargetType = "MEMORY" | "USER" | "MESSAGE";

export type ReportReason =
  | "INAPPROPRIATE"
  | "SPAM"
  | "HARASSMENT"
  | "PRIVACY"
  | "OTHER";

export type CreateReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  note?: string;
};

export type Report = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  note: string | null;
  status: string;
  createdAt: string;
};

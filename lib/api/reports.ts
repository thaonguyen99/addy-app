import { apiPost } from "@/lib/api/client";
import type { CreateReportInput, Report } from "@/types/api";

/** Report a memory or user. Re-reporting the same target returns the existing report. */
export async function createReport(input: CreateReportInput) {
  return apiPost<Report>("/reports", input);
}

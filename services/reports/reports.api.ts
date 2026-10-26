import { apiPost } from "@/services/api/client";
import type { CreateReportInput, Report } from "./reports.type";

/** Report a memory or user. Re-reporting the same target returns the existing report. */
async function createReport(input: CreateReportInput) {
  return apiPost<Report>("/reports", input);
}

export const reportApi = {
  createReport,
};

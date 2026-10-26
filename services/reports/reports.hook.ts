import { useMutation } from "@tanstack/react-query";

import { reportApi } from "./reports.api";
import type { CreateReportInput } from "./reports.type";

export function useCreateReportMutation() {
  return useMutation({
    mutationFn: (input: CreateReportInput) => reportApi.createReport(input),
  });
}

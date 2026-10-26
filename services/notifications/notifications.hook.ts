import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/keys";
import { notificationApi } from "./notifications.api";
import type {
  DevicePlatform,
  NotificationPreferences,
} from "./notifications.type";

export function useNotificationPreferencesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: notificationApi.getNotificationPreferences,
    enabled,
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) =>
      notificationApi.updateNotificationPreferences(patch),
    onMutate: async (patch) => {
      const key = queryKeys.notificationPreferences;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<NotificationPreferences>(key);
      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(key, {
          ...previous,
          ...patch,
        });
      }
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.notificationPreferences,
          context.previous,
        );
      }
    },
    onSuccess: (prefs) => {
      queryClient.setQueryData(queryKeys.notificationPreferences, prefs);
    },
  });
}

export function useRegisterDeviceTokenMutation() {
  return useMutation({
    mutationFn: (input: { token: string; platform: DevicePlatform }) =>
      notificationApi.registerDeviceToken(input.token, input.platform),
  });
}

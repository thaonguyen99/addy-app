import {
  formatNotification,
  type NotificationDto,
} from "@/services/notifications";
import type { InAppNotification } from "@/stores/in-app-notification.store";
import { targetFromRow } from "./notification-target";

/** "hanni" — the part of the title shown bold. */
export function leadActor(row: NotificationDto): string {
  return row.actors[0]?.username ?? "Someone";
}

export function bannerFromRow(row: NotificationDto): InAppNotification {
  const { title, body } = formatNotification(row);
  return {
    title,
    body,
    lead: leadActor(row),
    actor: row.actors[0] ?? null,
    thumbUrl: row.data.thumbUrl,
    target: targetFromRow(row),
  };
}

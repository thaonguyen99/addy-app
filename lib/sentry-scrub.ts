import type { ErrorEvent } from "@sentry/react-native";

const URL_WITH_QUERY = /(https?:\/\/[^\s?#"']+)[?#][^\s"']*/g;

/** Coordinates and the Goong key travel in query strings. */
export function stripUrlQueries(text: string): string {
  return text.replace(URL_WITH_QUERY, "$1");
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.message) event.message = stripUrlQueries(event.message);
  if (event.request?.url) event.request.url = stripUrlQueries(event.request.url);
  delete event.request?.query_string;
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = stripUrlQueries(exception.value);
  }
  return event;
}

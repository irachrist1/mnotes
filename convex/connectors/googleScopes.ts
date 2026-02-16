export type GoogleProvider = "gmail" | "google-calendar";

export const GOOGLE_SCOPES = {
  gmailReadonly: "https://www.googleapis.com/auth/gmail.readonly",
  gmailCompose: "https://www.googleapis.com/auth/gmail.compose",
  gmailSend: "https://www.googleapis.com/auth/gmail.send",
  gmailModify: "https://www.googleapis.com/auth/gmail.modify",
  calendarReadonly: "https://www.googleapis.com/auth/calendar.readonly",
  calendarFull: "https://www.googleapis.com/auth/calendar",
  mailGoogleCom: "https://mail.google.com/",
} as const;

export function normalizeScopes(scopes: unknown): string[] {
  if (!Array.isArray(scopes)) return [];
  return scopes.map(String).map((s) => s.trim()).filter(Boolean);
}

export function hasAnyScope(tokenScopes: unknown, acceptable: string[]): boolean {
  const s = new Set(normalizeScopes(tokenScopes));
  return acceptable.some((a) => s.has(a));
}

export function requiredScopesForTool(toolName: string): string[] {
  switch (toolName) {
    case "gmail_list_recent":
    case "gmail_search_messages":
      return [GOOGLE_SCOPES.gmailReadonly, GOOGLE_SCOPES.gmailModify, GOOGLE_SCOPES.mailGoogleCom];
    case "gmail_create_draft":
      return [GOOGLE_SCOPES.gmailCompose, GOOGLE_SCOPES.gmailModify, GOOGLE_SCOPES.mailGoogleCom];
    case "gmail_send_email":
      return [GOOGLE_SCOPES.gmailSend, GOOGLE_SCOPES.gmailCompose, GOOGLE_SCOPES.gmailModify, GOOGLE_SCOPES.mailGoogleCom];
    case "calendar_list_upcoming":
    case "calendar_get_agenda":
    case "calendar_find_free_slots":
      return [GOOGLE_SCOPES.calendarReadonly, GOOGLE_SCOPES.calendarFull];
    case "calendar_create_event":
      return [GOOGLE_SCOPES.calendarFull];
    default:
      return [];
  }
}

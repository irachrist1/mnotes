---
name: outlook
description: Manage Outlook and Office 365 email and calendar. Read, search, and send Outlook emails, and view Outlook Calendar events. Use when the user mentions Outlook, Office 365, work email, or Microsoft email.
---

# Outlook / Office 365 Skill

You can access the user's Outlook account via Microsoft Graph API.

## Available Actions

- **outlook_list_emails**: List recent inbox emails
- **outlook_search_emails**: Search by keyword
- **outlook_get_email**: Read full email content
- **outlook_send_email**: Send email (confirm with user first)
- **outlook_list_calendar**: View upcoming Outlook calendar events

## Best Practices

1. When searching, use specific keywords from the user's request
2. OData filters: `isRead eq false` for unread, `importance eq 'high'` for flagged
3. Always show sender, subject, and date when listing emails
4. Confirm before sending — show draft details to user first
5. Calendar events show timezone-aware times

## Example Patterns

"Check my work email" → `outlook_list_emails` with top=10
"Any flagged messages?" → `outlook_list_emails` with filter=`importance eq 'high'`
"Find the email from HR about benefits" → `outlook_search_emails` with query="HR benefits"
"What meetings do I have this week at work?" → `outlook_list_calendar`

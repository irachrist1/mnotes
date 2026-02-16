---
name: gmail
description: Manage Gmail emails. Read, search, draft, and send emails via the user's Gmail account. Use when the user asks about email, inbox, messages, or wants to send/draft an email.
---

# Gmail Skill

You can access the user's Gmail account to read and manage emails.

## Available Actions

- **gmail_list_recent**: List recent inbox messages
- **gmail_search**: Search with Gmail query syntax (from:, subject:, is:unread, after:, etc.)
- **gmail_get_message**: Read full email content by ID
- **gmail_send**: Send an email (requires user confirmation in your response before calling)
- **gmail_create_draft**: Save a draft without sending

## Best Practices

1. When checking for urgent messages, use `is:unread` + `is:important` filters
2. Always summarize emails clearly: sender, subject, key action needed
3. Before sending any email, show the user the draft and confirm they want to send
4. Use gmail_create_draft when the user wants to review before sending
5. For searching: Gmail operators like `from:boss@company.com`, `subject:invoice`, `after:2024/01/01`

## Example Patterns

"Check my email" → `gmail_list_recent` with INBOX,UNREAD labels
"Any urgent emails?" → `gmail_search` with `is:unread is:important`
"Email from John about the project" → `gmail_search` with `from:john subject:project`

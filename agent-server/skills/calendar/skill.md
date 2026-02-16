---
name: calendar
description: Manage Google Calendar. List events, check availability, find free time slots, and create events. Use when the user asks about their schedule, calendar, meetings, or wants to book time.
---

# Google Calendar Skill

You can access the user's Google Calendar to manage their schedule.

## Available Actions

- **calendar_list_events**: List upcoming events (with optional time range)
- **calendar_get_agenda**: Get all events for a specific day
- **calendar_find_free_slots**: Find available time slots for scheduling
- **calendar_create_event**: Create a new event (confirm with user first)

## Best Practices

1. When asked about schedule, default to showing the next 7 days
2. Use `calendar_get_agenda` for "what's on my calendar today/tomorrow"
3. Use `calendar_find_free_slots` before suggesting meeting times
4. Always confirm event details before creating: title, time, duration, attendees
5. Show timezone context when displaying times

## Example Patterns

"What's on my calendar today?" → `calendar_get_agenda` with today's date
"Schedule a meeting with Sarah next week" → find free slots, then confirm before creating
"Do I have time for a 1hr call on Friday?" → `calendar_find_free_slots` for Friday, 60 min

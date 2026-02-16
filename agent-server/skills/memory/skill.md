---
name: memory
description: Proactively save and recall memories about the user. Use when the user shares personal information, preferences, corrections, project details, or any information worth remembering for future conversations.
---

# Memory Skill

You have access to a three-tier memory system. Use it proactively and automatically.

## When to Save Memories

**ALWAYS save without being asked:**
- When the user corrects you → `correction` category, importance 10
- When the user shares preferences → `preference` category
- When the user mentions their projects, work, or goals → `project` category
- When the user shares facts about themselves → `fact` category
- After any conversation where something important was discussed → save a summary

## Memory Tiers

- **persistent**: Personal facts, preferences, corrections, project names — loaded every session
- **archival**: Detailed documents, meeting notes, research — loaded on demand
- **session**: This-conversation-only context — discarded after conversation ends

## Examples

User says "I prefer dark mode" → Save: tier=persistent, category=preference, title="UI preference: dark mode", content="User prefers dark mode in all applications", importance=6

User says "Actually my name is Chris, not Christian" → Save: tier=persistent, category=correction, title="Correct name is Chris", content="User's preferred name is Chris, not Christian", importance=10

User says "I'm working on a React Native app called Luna" → Save: tier=persistent, category=project, title="Project: Luna (React Native app)", content="User is building a React Native app called Luna", importance=7

## Tool Usage

Use `memory_save` to save new memories.
Use `memory_search` to look up something you half-remember.
Use `memory_list` to see all persistent memories about the user.

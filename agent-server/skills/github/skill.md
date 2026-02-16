---
name: github
description: GitHub developer workflow integration. List and review pull requests and issues, check repository activity, and create issues. Use when the user asks about code, PRs, issues, deployments, builds, or GitHub repositories.
---

# GitHub Skill

You can access GitHub repositories to support the user's development workflow.

## Available Actions

- **github_list_prs**: List open/closed PRs for a repo
- **github_list_issues**: List issues with optional label/assignee filters
- **github_get_pr**: Get full PR details including comments
- **github_create_issue**: Create a new issue (confirm title/body with user first)
- **github_get_repo_activity**: Recent events in a repo
- **github_list_my_prs**: All PRs involving the authenticated user

## Best Practices

1. When the user mentions a repo, use `owner/repo` format
2. For "what needs my attention?" → use `github_list_my_prs` + `github_list_issues` with assignee=me
3. Summarize PRs clearly: number, title, status, last updated
4. Before creating issues, draft the title and body for user review
5. For build/deploy status, check recent events with `github_get_repo_activity`

## Example Patterns

"What PRs are waiting for my review?" → `github_list_my_prs` state=open
"Any critical bugs open in my app?" → `github_list_issues` with labels=bug, state=open
"What happened in the repo today?" → `github_get_repo_activity`

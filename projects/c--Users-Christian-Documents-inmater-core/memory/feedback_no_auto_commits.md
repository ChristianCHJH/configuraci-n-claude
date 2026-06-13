---
name: Never auto-commit, always validate
description: Never generate commits automatically; always require explicit user request with validation
type: feedback
originSessionId: 9f6e7396-efc6-4977-aa4a-0c84a13493ad
---
**Rule:** Never generate git commits automatically. Never suggest commits. If the user explicitly requests a commit, always validate first by asking "¿Seguro que quieres que se haga el commit?" before proceeding.

**Why:** User has noticed accidental commits happening when answering "yes" to suggestions, which disrupts workflow and creates unwanted commits.

**How to apply:** 
- Never call `git commit` without explicit user request
- Never suggest "shall I commit this?"
- If user says "commit this" or "make a commit", ALWAYS ask for confirmation first
- This applies to ALL conversations, no exceptions
- Even if user gives vague instructions that could imply a commit, do not assume — ask if they want one

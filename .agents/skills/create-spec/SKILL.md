---
name: create-spec
description: >-
  Create a spec file and feature branch for the next step of the project development. Use this skill when the user asks to "create a spec", "start next step", or explicitly invoke the create-spec skill.
---

# Create Spec

You are a senior developer spinning up a new feature spec for the project. Always follow the rules in `AGENTS.md`.

## Step 1 — Parse the arguments
Extract the following from the user's request (ask if missing):

1. `step_number` — zero-padded to 2 digits: 2 → 02, 11 → 11
2. `feature_title` — human readable title in Title Case (e.g., "Data Layer", "Agent Core")
3. `feature_slug` — git and file safe slug (Lowercase, kebab-case. e.g. data-layer)
4. `branch_name` — format: `feature/<feature_slug>`

## Step 2 — Check working directory
Run `git status`. If there are unstaged or uncommitted changes, tell the user to commit or stash them before proceeding.
Run `git branch` to check if `branch_name` exists. If it does, append `-01`, `-02`, etc.

## Step 3 — Switch to branch
Run:
```bash
git checkout main
git pull origin main
git checkout -b <branch_name>
```
*(If git is not fully initialized with commits, or `main` doesn't exist yet, simply create the branch with `git checkout -b <branch_name>` or skip to Step 4 if branch creation fails)*

## Step 4 — Research the codebase
Read `AGENTS.md` and any existing files in `.claude/specs/` to understand what is already built and what constraints apply.

## Step 5 — Write the spec
Generate a spec document with this exact structure:

```markdown
---
# Spec: <feature_title>

## Overview
One paragraph describing what this feature does and why it exists.

## Endpoints / API Routes
Every new API route needed:
- `METHOD /path` — description
If no new routes: state "No new routes".

## Data / State Changes
Any changes to the in-memory state, store.js, or JSON seed data.
If none: state "No data model changes".

## Files to modify
List existing files that will be changed and what changes will be made.

## Files to create
List every new file to be created.

## Rules for implementation
Specific constraints (e.g. no ORMs, hardcoded escalation rules, Gemini structured output, React Vite).

## Definition of done
A specific testable checklist to verify the feature.
---
```

## Step 6 — Save the spec
Save the generated spec using `write_to_file` to: `.claude/specs/<step_number>-<feature_slug>.md`

## Step 7 — Report to the user
Print a short summary in this format:
```text
Branch:    <branch_name>
Spec file: .claude/specs/<step_number>-<feature_slug>.md
Title:     <feature_title>
```
Ask the user to review the spec and provide feedback before starting implementation.

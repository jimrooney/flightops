# AI Context

This repository hosts **FlightOpsNXG**, a Node/TypeScript monorepo for flight operations APIs and mocks.

## Important Files

- ARCHITECTURE.md → explains the overall service/package structure
- BUILD_NOTES.md → development notes and changelog

## Development Rules

When modifying this project:

- Prefer small targeted edits
- Do not rewrite files unnecessarily
- Keep workspace package names and script references consistent
- Validate runtime changes with `npm run test:sync-smoke` when relevant

## Publish Workflow (Agent Rule)

Agent instruction:  
When the user says **publish**, execute the following workflow exactly:

1. Update BUILD_NOTES.md if any changes were made
2. Update ARCHITECTURE.md if architecture changed
3. Run `scripts/publish.ps1` to commit and push
4. Ensure publish completion sound plays: `C:\Home\Jim\System\sounds\gotthis.wav`

Prefer one clean commit per publish.

## Prompt/Decision Alert (Agent Rule)

If a user prompt/decision is required to continue and cannot be safely assumed, play:

- `C:\Home\Jim\System\sounds\garage.wav`

Then ask the blocking question.

## Completion Checkpoint Alert (Agent Rule)

A "completion checkpoint" is when a requested task is finished, validated, and waiting on user direction (for example review or publish).

At completion checkpoints, play:

- `C:\Home\Jim\System\sounds\gotthis.wav`

## Completion Sound

We rely on VS Code Audio Cues (built-in) for completion feedback.

If completion sound does not play, open Settings and search for `Audio Cues`, then ensure these are enabled:

- `audioCues.enabled` = `on`
- `audioCues.taskCompleted` = `on`
- `audioCues.taskFailed` = `on`

## Security

- Never commit API secrets
- OAuth client IDs are acceptable
- This repository is public

## Purpose of AI Context

This file provides persistent project knowledge so the AI understands the repository even in new chat sessions.

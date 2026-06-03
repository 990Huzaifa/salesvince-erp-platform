# AGENTS.md

## Working Rules

- Use as few tokens as possible while still being clear.
- Prefer small, targeted changes over broad rewrites.
- Do not show API payloads, raw request bodies, or JSON examples in the UI.
- Keep user-facing copy short and direct.
- Do not explain things when given input and showing output.
- Use `apply_patch` for manual file edits.
- Verify changes with a build when practical.

## Notes

- If a feature needs request or response examples, keep them in code or docs, not in rendered interface text.
- Avoid adding new explanatory blocks that repeat backend payload shapes.

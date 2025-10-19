# Commit Changes

You are tasked with creating git commits for the changes made during this session.

## Process:

1. **Think about what changed:**
   - Review the conversation history and understand what was accomplished
   - Run `git status` to see current changes
   - Run `git diff` to understand the modifications
   - Consider whether changes should be one commit or multiple logical commits

2. **Plan your commit(s):**
   - Identify which files belong together (consider frontend/backend separation)
   - Draft clear, descriptive commit messages
   - Use imperative mood in commit messages
   - Focus on why the changes were made, not just what
   - Consider grouping by feature area (scheduler, notion, UI, etc.)

3. **Present your plan to the user:**
   - List the files you plan to add for each commit
   - Show the commit message(s) you'll use
   - Indicate if changes affect frontend, backend, or both
   - Ask: "I plan to create [N] commit(s) with these changes. Shall I proceed?"

4. **Execute upon confirmation:**
   - Use `git add` with specific files (never use `-A` or `.`)
   - Create commits with your planned messages
   - Show the result with `git log --oneline -n [number]`

## Important:

- **NEVER add co-author information or Claude attribution**
- Commits should be authored solely by the user
- Do not include any "Generated with Claude" messages
- Do not add "Co-Authored-By" lines
- Write commit messages as if the user wrote them

## Remember:

- You have the full context of what was done in this session
- Group related changes together (frontend/backend, feature areas)
- Keep commits focused and atomic when possible
- Consider the monorepo structure (packages/frontend, packages/backend)
- The user trusts your judgment - they asked you to commit

## Example Commit Message Patterns:

- `feat: add new housework category feature`
- `fix: resolve TypeORM entity relationship issue`
- `refactor: improve scheduler service structure`
- `docs: update API documentation in README`
- `style: format code with prettier`
- `test: add unit tests for scheduler module`

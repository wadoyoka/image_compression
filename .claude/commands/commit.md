---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git diff:*), Bash(git branch:*), Bash(git log:*)
description: Create a git commit
---

# Smart Commit Command

This command analyzes staged changes and generates an appropriate commit message before creating a commit.

## Context
- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Execution Steps

1. **Analyze Changes**
   - Check staged changes with `git diff --cached`
   - Review changed files with `git status`

2. **Generate Commit Message**
   - Analyze changes and select appropriate emoji and type
   - Create a concise and clear subject **in Japanese**
   - Format: `絵文字 type: subject`

3. **Execute Commit**
   - Stage all changes and commit immediately
   ```bash
   git add FILE_NAMES
   git commit -m COMMIT_MESSAGE
   ```

4. **Handle pre-commit Hook**
   - If pre-commit hook modifies files:
     ```bash
     git status
     git add EDITED_FILE_NAMES
     git commit -m COMMIT_MESSAGE
     ```

## Available Commit Types

| Emoji | Type | Usage |
|-------|------|-------|
| ✨ | feat | New feature |
| 🐛 | fix | Bug fix |
| 🔨 | refactor | Code refactoring |
| 💄 | style | Style changes |
| ✅ | test | Add or modify tests |
| ⚰️ | remove | Remove code |
| 📚 | docs | Documentation changes |
| 🔍️ | seo | SEO improvements |
| ⚡️ | perf | Performance improvements |
| 💚 | format | Code formatting |
| 📦️ | package | Package updates |
| ⏪️ | revert | Revert changes |
| 🔀 | merge | Merge branches |
| 🚧 | wip | Work in progress |
| 🧑‍💻 | dev | Development changes |
| 🚀 | release | Release |

## Conversation History Mode

When user requests to include conversation history in commit message:

1. **Format**: Use extended Conventional Commits format
   ```
   絵文字 type: <subject>

   [optional body]

   prompt: <user's input>
   ----
   <assistant's response summary>
   ----
   prompt: <user's input>
   ----
   <assistant's response summary>
   ```

2. **Structure**:
   - First line: Standard emoji + type + subject (Japanese)
   - Blank line
   - Optional body describing overall changes
   - Blank line
   - Conversation history with exchanges separated by `----`
   - Include user prompts and concise summaries of responses

3. **Guidelines**:
   - Keep first line under 100 characters
   - Summarize assistant responses (don't include full text)
   - Use present tense for descriptions
   - Include relevant context from conversation

## Important Notes

- If no staged changes exist, display error message and exit
- Keep commit message under 100 characters
- If changes span multiple types, focus on the most significant change
- **Commit messages must be written in Japanese**
- **No user confirmation required - commit immediately**
- **Push is not performed - user must push manually**
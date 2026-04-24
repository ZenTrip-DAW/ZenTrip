
## Approach
- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read unless the file may have changed.
- Skip files over 100KB unless explicitly required.
- Suggest running /cost when a session is running long to monitor cache ratio.
- Recommend starting a new session when switching to an unrelated task.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.
## Token Efficiency
- Never explain what you're about to do — just do it.
- Never summarize what you just did unless asked.
- Skip confirmations for obvious safe actions (reading files, running tests).
- Omit file contents in output when only the path matters.
- When showing diffs, only show changed lines ±3 context lines.
- Batch related file reads into a single step.
- If a task has >3 steps, outline the plan in one line, then execute silently.
- Never repeat back the user's request.
- Avoid "Here is...", "I'll now...", "Done!" and similar filler.
- Truncate long terminal output — show first/last 20 lines, skip the middle.
- Prefer grep/find over reading whole files to locate information.
- Use TodoWrite only for complex multi-session tasks, not routine work.
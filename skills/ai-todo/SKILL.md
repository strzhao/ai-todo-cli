---
name: ai-todo
description: "Manage tasks, track progress, and log daily updates via the ai-todo CLI. Trigger scenarios: 1) EXPLICIT — user mentions tasks, todos, to-do lists, progress tracking, daily standup, sprint planning, project management, work logs, or task completion. 2) POST-ACTION (proactive) — after git commit, git push, deploy to Vercel, merge PR, release, or any significant milestone (feature implemented, bug fixed, refactor done), proactively log progress and update/complete related tasks. When git-tools or vercel:deploy skill finishes, ALWAYS trigger this skill to record what was accomplished. 3) PRE-ACTION (proactive) — when user discusses implementation plans, architecture design, feature breakdown, technical specs, RFC, sprint planning, or requirement analysis, proactively suggest creating tasks to track planned work. When brainstorming skill completes, trigger this skill to convert outcomes into trackable tasks. 4) SESSION-END — when a work session involves substantial code changes, suggest a progress summary before ending. This skill connects to ai-todo (https://ai-todo.stringzhao.life) for persistent task management across sessions."
---

# AI Todo - Task Management for AI Agents

Manage tasks, track progress, and maintain daily work logs through the `ai-todo` CLI tool. This tool connects to the ai-todo service for persistent, cross-session task management.

## Prerequisites

The `ai-todo` CLI must be installed and authenticated. Before running any command, check if credentials exist:

```bash
cat ~/.config/ai-todo/credentials.json 2>/dev/null
```

If not authenticated, run `ai-todo login` first. The CLI outputs JSON for all commands, so parse responses accordingly.

If the `ai-todo` command is not found, install it:

```bash
npm install -g ai-todo-cli
```

## Command Reference

All commands follow the pattern `ai-todo <command> [options]` and output JSON.

### Task Operations

**List tasks** - View tasks with optional filters:
```bash
ai-todo tasks:list                           # All tasks
ai-todo tasks:list --filter today            # Today's tasks
ai-todo tasks:list --filter assigned         # Assigned to me
ai-todo tasks:list --filter completed        # Completed tasks
ai-todo tasks:list --space_id <id>           # Tasks in a space
```

**Create a task** - Always include a clear, actionable title:
```bash
ai-todo tasks:create --title "Implement user auth" \
  --description "Add JWT-based authentication to the API" \
  --priority 1 \
  --due_date "2025-03-15T00:00:00Z" \
  --tags "backend,auth" \
  --space_id <id> \
  --parent_id <id>
```

Priority levels: 0=P0 urgent, 1=P1 high, 2=P2 normal, 3=P3 low. Default to P2 unless the user indicates urgency.

**Update a task** - Modify any field including progress:
```bash
ai-todo tasks:update --id <task_id> \
  --title "New title" \
  --progress 60 \
  --priority 1
```

Progress is 0-100. Update progress as work advances rather than only at completion.

**Complete a task** - Marks task and its subtasks as done:
```bash
ai-todo tasks:complete --id <task_id>
```

**Delete a task** - Cascades to subtasks:
```bash
ai-todo tasks:delete --id <task_id>
```

### Progress Logs

Progress logs are timestamped entries that track what happened on a task. Use them to maintain a history of work done.

**View logs:**
```bash
ai-todo tasks:logs --id <task_id>
```

**Add a log entry** - Record what was accomplished:
```bash
ai-todo tasks:add-log --id <task_id> --content "Implemented login endpoint, added JWT validation middleware"
```

### Spaces

Spaces are containers for organizing tasks by project or team.

```bash
ai-todo spaces:list                                    # List all spaces
ai-todo spaces:create --name "Backend API" --description "API development tasks"
```

### Task Hierarchy

Tasks support parent-child relationships for breaking down work:
```bash
# Create a parent task
ai-todo tasks:create --title "User authentication system"

# Create subtasks under it (use the parent's ID from the response)
ai-todo tasks:create --title "Design auth schema" --parent_id <parent_id>
ai-todo tasks:create --title "Implement login endpoint" --parent_id <parent_id>
ai-todo tasks:create --title "Add JWT middleware" --parent_id <parent_id>
```

## Workflow Patterns

### Starting a work session

At the beginning of a session, check existing tasks to understand current priorities:

```bash
ai-todo tasks:list --filter today
ai-todo tasks:list --filter assigned
```

Review what's in progress and what needs attention.

### Task creation from development context

When the user describes work to be done or you identify actionable items from code review, create tasks with appropriate structure:

1. Create a parent task for the overall objective
2. Break it into subtasks for individual steps
3. Set priorities based on dependencies and urgency
4. Add due dates if the user specifies deadlines

Example - user says "I need to add search functionality to the app":
```bash
# Create parent
ai-todo tasks:create --title "Add search functionality" --priority 2

# Create subtasks (using parent_id from response)
ai-todo tasks:create --title "Add search API endpoint" --parent_id <id> --priority 2
ai-todo tasks:create --title "Build search UI component" --parent_id <id> --priority 2
ai-todo tasks:create --title "Add search indexing" --parent_id <id> --priority 2
```

### Progress tracking during development

As you complete work, update task progress and add logs:

1. When starting a task: update progress to 10-20%
2. At meaningful checkpoints: increment progress
3. When done: set progress to 100 and complete the task
4. Always add a log entry describing what was accomplished

```bash
ai-todo tasks:update --id <id> --progress 50
ai-todo tasks:add-log --id <id> --content "Completed API endpoint, starting frontend integration"
```

### Daily progress summary

When the user asks for a daily standup or progress update, or at the end of a session:

1. List today's tasks and completed tasks
2. For each active task, add a log summarizing the day's work
3. Update progress percentages to reflect current state

```bash
# Check what was worked on
ai-todo tasks:list --filter today
ai-todo tasks:list --filter completed

# Log daily progress on active tasks
ai-todo tasks:add-log --id <id> --content "Today: fixed 3 bugs in auth module, added input validation. Next: write integration tests"
```

### Post-action workflow (after commit/deploy)

When a git commit, push, or deployment completes successfully:

1. List existing tasks to find related ones:
```bash
ai-todo tasks:list --filter assigned
```
2. If related task exists: update progress, add a detailed log, mark complete if done
3. If no related task exists: suggest creating one to record the completed work
4. Keep it lightweight — one log entry summarizing what was done, not a lengthy report

Example — after a successful deploy:
```bash
# Find related task
ai-todo tasks:list --space_id <id>

# Log the accomplishment
ai-todo tasks:add-log --id <task_id> --content "Completed and deployed: added search UI with debounced input, integrated with search API endpoint"

# Complete if fully done
ai-todo tasks:complete --id <task_id>
```

### Pre-action workflow (during planning/design)

When the user is discussing implementation plans, architecture design, or feature breakdown:

1. Listen for actionable items in the discussion
2. Suggest creating a task hierarchy to track the planned work:
```bash
# Create parent task for the overall plan
ai-todo tasks:create --title "Implement user search feature" --priority 2 --space_id <id>

# Break into subtasks
ai-todo tasks:create --title "Design search API schema" --parent_id <id> --priority 2
ai-todo tasks:create --title "Build search index pipeline" --parent_id <id> --priority 2
ai-todo tasks:create --title "Create search UI component" --parent_id <id> --priority 2
```
3. Set priorities based on dependencies discussed in the plan

### Cross-skill collaboration

This skill works alongside other skills:

- **After git-tools**: When git-tools completes a commit workflow, automatically trigger ai-todo to log progress on related tasks
- **After vercel:deploy**: When deployment succeeds, log the deployment as progress and update/complete related tasks
- **After brainstorming**: When brainstorming produces an action plan, convert it into a task hierarchy

## Error Handling

- Exit code 0: success, parse the JSON response
- Exit code 1: error, check the `error` field in JSON
- Exit code 2: not authenticated, run `ai-todo login`

If you get exit code 2, inform the user they need to authenticate before task management features work.

## Best Practices

- Write task titles as clear, actionable statements ("Implement X" not "X stuff")
- Use subtasks to break complex work into manageable pieces
- Update progress incrementally, not just at 0% and 100%
- Add log entries with specific details about what was done, not vague summaries
- Include both "what was done" and "what's next" in progress logs
- Use tags to categorize tasks by area (frontend, backend, infra, docs)
- Set realistic priorities - not everything is P0

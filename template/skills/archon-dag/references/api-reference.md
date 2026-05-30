# Archon V2 REST API Reference

**Version**: 0.3.10 (Bun/TypeScript DAG workflow engine)
**Base URL**: `http://localhost:3090` (configurable via `--port`)
**Server Start**: `archon serve`
**CLI Location**: `/usr/local/bin/archon`

> **Important**: This is the V2 Archon workflow engine API. The V1 knowledge/RAG API (port 8181, `/api/knowledge-items/*`) is archived and NOT available. Do NOT confuse endpoints.

## Quick Reference

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| Health | GET | `/api/health` | Server status, concurrency, version |
| Workflows | GET | `/api/workflows` | List all workflows (with sources) |
| Workflows | GET | `/api/workflows/{name}` | Get workflow definition |
| Workflows | PUT | `/api/workflows/{name}` | Save/update workflow YAML |
| Workflows | DELETE | `/api/workflows/{name}` | Delete a workflow |
| Workflows | POST | `/api/workflows/validate` | Validate a workflow definition |
| Runs | POST | `/api/workflows/{name}/run` | Start a workflow run |
| Runs | GET | `/api/workflows/runs` | List recent workflow runs |
| Runs | GET | `/api/workflows/runs/{runId}` | Get run details + status |
| Runs | GET | `/api/workflows/runs/by-worker/{platformId}` | Get run by worker ID |
| Runs | POST | `/api/workflows/runs/{runId}/cancel` | Cancel a running workflow |
| Runs | POST | `/api/workflows/runs/{runId}/resume` | Resume a paused workflow |
| Runs | POST | `/api/workflows/runs/{runId}/abandon` | Abandon a workflow run |
| Runs | POST | `/api/workflows/runs/{runId}/approve` | Approve an interactive node |
| Runs | POST | `/api/workflows/runs/{runId}/reject` | Reject an interactive node |
| Runs | DELETE | `/api/workflows/runs/{runId}` | Delete a workflow run |
| Dashboard | GET | `/api/dashboard/runs` | Dashboard view of all runs |
| Conversations | GET | `/api/conversations` | List conversations |
| Conversations | GET | `/api/conversations/{id}` | Get conversation details |
| Conversations | POST | `/api/conversations` | Create a conversation |
| Conversations | PUT | `/api/conversations/{id}` | Update conversation |
| Conversations | DELETE | `/api/conversations/{id}` | Delete conversation |
| Messages | GET | `/api/conversations/{id}/messages` | List messages in conversation |
| Messages | POST | `/api/conversations/{id}/messages` | Send a message |
| Codebases | GET | `/api/codebases` | List codebases |
| Codebases | GET | `/api/codebases/{id}` | Get codebase details |
| Codebases | POST | `/api/codebases` | Add a codebase |
| Codebases | DELETE | `/api/codebases/{id}` | Delete a codebase |
| Env Vars | GET | `/api/codebases/{id}/env` | List env vars for codebase |
| Env Vars | PUT | `/api/codebases/{id}/env` | Set an env var |
| Env Vars | DELETE | `/api/codebases/{id}/env/{key}` | Delete an env var |
| Config | GET | `/api/config` | Get global config |
| Config | GET | `/api/config/assistants` | Get assistant config |
| Config | PATCH | `/api/config/assistants` | Update assistant config |
| Providers | GET | `/api/providers` | List AI providers |
| Environments | GET | `/api/codebases/{id}/environments` | List isolation environments |
| Update | GET | `/api/update-check` | Check for Archon updates |
| Stream | GET | `/api/stream/{conversationId}` | SSE stream for conversation |
| Stream | GET | `/api/stream/__dashboard__` | SSE stream for dashboard |
| Artifacts | GET | `/api/artifacts/{runId}/*` | Get run artifacts (files) |

## CLI Quick Reference

```bash
archon workflow list                    # List workflows in CWD
archon workflow run <name> [message]    # Run a workflow
archon workflow status                  # Show running workflows
archon validate workflows [name]        # Validate workflow YAML files
archon serve                            # Start web UI + API server
archon isolation list                   # List git worktrees
archon isolation cleanup [days]         # Remove stale worktrees (default: 7)
archon isolation cleanup --merged       # Remove worktrees for merged branches
archon chat <message>                   # Chat with orchestrator
archon continue <branch> [msg]          # Continue work on existing branch
archon complete <branch> [...]          # Complete branch lifecycle
archon setup                            # Interactive setup wizard
archon version                          # Show version info
```

## Common Patterns

### Run a Video Pipeline
```bash
# Via CLI
cd ~/archon-video-generation-workflow
archon workflow run remotion-idea-to-video "idea fast-food restaurant secret menu hack"

# Via API
curl -X POST http://localhost:3090/api/workflows/remotion-idea-to-video/run \
  -H "Content-Type: application/json" \
  -d '{"message": "idea fast-food restaurant secret menu hack"}'
```

### Check Pipeline Status
```bash
# Via CLI
archon workflow status

# Via API
curl http://localhost:3090/api/workflows/runs?limit=5
```

### Get Artifacts from a Completed Run
```bash
# List files
curl http://localhost:3090/api/artifacts/{runId}/

# Get a specific file
curl http://localhost:3090/api/artifacts/{runId}/slug.json
```

### Cancel a Stuck Run
```bash
curl -X POST http://localhost:3090/api/workflows/runs/{runId}/cancel
```

## Architecture Notes

- **Database**: SQLite at `~/.archon/archon.db`
- **Worktrees**: `~/.archon/workspaces/{user}/{repo}/worktrees/`
- **Home workflows**: `~/.archon/workflows/` (global scope)
- **Project workflows**: `.archon/workflows/` (project scope)
- **Precedence**: project > global > bundled defaults
- **Max concurrent**: 10 (configurable)
- **SSE streaming**: Real-time events for conversations and dashboard
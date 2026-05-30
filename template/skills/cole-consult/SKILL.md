---
name: cole-consult
description: Consult the Cole Medlin Academy knowledge base when building Archon workflows, designing agent harnesses, structuring DAGs, organizing multi-agent loops, or deciding on patterns for Pi/Archon projects. Provides pattern translation from Cole's methods to our Pi+Ollama+Archon stack. Invoke when you need architectural guidance, pattern recommendations, or want to check "how would Cole approach this?"
---

# Cole Consult Skill

Use this skill when you need architectural guidance from Cole Medlin's patterns. This is for **design decisions**, not for building.

Knowledge base location: `/Users/adam26/chow-work/cole-medlin-academy/`

## Quick Consult — Read These Playbooks First

| If You're Working On... | Read This Playbook |
|---|---|
| Archon workflow design, DAG patterns, node types | `playbooks/archon-official-guide.md` |
| PiV loop, harness structure, deterministic+LLM mix | `playbooks/harnesses-deep-dive.md` |
| Multi-agent specialist routing, tool bloat | `playbooks/multi-agent-harnesses.md` |
| Dark factory, autonomous production loops | `playbooks/dark-factory.md` |
| Ralph Wiggum loop, fresh-context iteration | `playbooks/ralph-wiggum-loop.md` |
| Adversarial dev, GAN-style gen vs eval | `playbooks/adversarial-dev.md` |
| 10x workflow anatomy, PIV pattern | `playbooks/10x-coding-workflow.md` |
| Video generation pipeline design | `playbooks/video-generation-hyperframes.md` |
| Pi+Archon integration specifics | `playbooks/pi-archon-integration.md` |
| Second brain, skills, progressive disclosure | `playbooks/second-brain-skills.md` |
| Claude-to-Pi migration, dependency mapping | `playbooks/workflow-adaptation.md` |
| Archon V2 changes, Supabase state, MCP | `playbooks/archon-v2-architecture.md` |
| Foundations (PIV, AI layer, workflows) | `playbooks/foundations-archon-and-workflows.md` |
| Agent fundamentals, career, simple+powerful | `playbooks/agent-fundamentals-and-career.md` |

All paths are relative to: `/Users/adam26/chow-work/cole-medlin-academy/`

## Common Consulting Patterns

### "How should I structure this workflow?"
→ Read `playbooks/harnesses-deep-dive.md` and `playbooks/archon-official-guide.md`
→ Key rule: deterministic nodes for plumbing, LLM nodes for judgment, `context: fresh` for implementation

### "How do I route models in a DAG?"
→ Read `playbooks/10x-coding-workflow.md`
→ Pattern: DeepSeek-v4-pro for planning/architecture, GLM-5.1 for coding, DS-Flash/Gemini for review, DS-Flash parallel for cheap specialist passes

### "Should I split this into multiple agents?"
→ Read `playbooks/multi-agent-harnesses.md`
→ Rule of 7: if a single prompt would need >7 tools, split into specialists
→ Pattern: orchestrator node (no tools, just routing) + specialist nodes (focused tools)

### "How do I make this autonomous / dark factory?"
→ Read `playbooks/dark-factory.md` and `playbooks/ralph-wiggum-loop.md`
→ Prerequisites: deterministic validation gate, browser test, git integration
→ Pattern: gen → eval → fix loop with `trigger_rule: one_success` for parallel reviewers

### "How would Cole build X?"
→ Invoke the cole-academy subagent with a specific question
→ `subagent cole-academy "How would Cole approach building [X] with Pi+Archon?"`

### "What's the PIV loop and how do I use it?"
→ PIV = Plan → Implement → Validate
→ Read `playbooks/foundations-archon-and-workflows.md`
→ Key: human gate after Plan, automated Validate gate, Implementation always gets `context: fresh`

## Deep Consult — Invoke the Subagent

For complex questions that need cross-referencing multiple playbooks or reading raw transcripts:

```
subagent cole-academy "Review our workflow at [path] and suggest improvements based on Cole's patterns"
subagent cole-academy "How would Cole design a dark factory for our video pipeline?"
subagent cole-academy "What's the Ralph Wiggum approach to iterating on our finance terminal?"
```

The subagent can read any playbook, transcript, or repo in the knowledge base.

## Key Stack Translations (Memorize These)

| Cole's Stack | Our Stack |
|---|---|
| Claude Code (Opus/Sonnet/Haiku) | Pi (DeepSeek-Pro/GLM-5.1/Gemini-Flash/DS-Flash) |
| Claude Skills (.claude/skills/) | Pi Extensions (.pi/agent/skills/) |
| CLAUDE.md global rules | Archon YAML + Pi agent configs |
| Archon + Claude provider | Archon + Pi provider (`interactive: false`) |
| $ARTIFACTS_DIR bash writes | Same — but Pi read/write tools can't resolve $ARTIFACTS_DIR |
| Sub-agents (Claude) | Archon DAG nodes (Pi) with `context: fresh` |
| Human gates via Claude | Archon workflow pauses or Adam review steps |
| Browser testing (Playwright) | Not yet wired — gap to fill |
| Git integration (auto PR) | Manual or Archon bash node git commit |

## Never Forget

1. **Fresh context per implementation node** — Cole's #1 rule. Never let a planning node's context bleed into implementation.
2. **Deterministic first, LLM second** — Bash nodes for plumbing, LLM nodes for judgment. Never use an LLM for what a script can do.
3. **Parallel reviewers** — Use `trigger_rule: one_success` or `all_done` to run cheap DS-Flash specialists in parallel after a build.
4. **Human gate after Plan** — Architecture decisions need human approval before implementation starts burning tokens.
5. **Artifacts are files** — Nodes communicate via `$ARTIFACTS_DIR` bash writes, not Pi's read/write tools.
6. **Tool bloat kills agents** — Max 5-7 tools per node. Split into specialist nodes if you need more.
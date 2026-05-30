---
name: eval-gate
description: Create or apply deterministic and LLM-assisted eval gates for Pi/Archon workflows. Use when a build, video, agent workflow, or code task needs a ship/fix/block decision, scoring rubric, validation artifact, or standardized EVAL.json.
---

# Eval Gate Skill

Use this skill to prevent "AI says it's done" without proof.

## Default Artifact Contract

Every serious workflow should produce:

```text
SPEC.md
PLAN.md
VALIDATION.md
EVAL.json
FINAL_REPORT.md
```

## Decision Values

- `ship` — validation green, requirements met, acceptable risk
- `fix_required` — implementation exists but needs another pass
- `blocked` — missing artifacts, missing credentials, unclear spec, or non-recoverable failure

## Minimum EVAL.json

```json
{
  "decision": "fix_required",
  "scores": {
    "requirements": 0,
    "code_quality": 0,
    "test_coverage": 0,
    "ux_or_output_quality": 0,
    "maintainability": 0
  },
  "checks": {
    "build_passes": false,
    "tests_pass": false,
    "lint_passes": false,
    "required_artifacts_present": false
  },
  "risks": [],
  "summary": "",
  "next_actions": []
}
```

## Rules

1. If build/tests fail, never choose `ship`.
2. If required artifacts are missing, choose `blocked`.
3. If acceptance criteria are incomplete, choose `fix_required`.
4. Use deterministic validation before LLM judgment.
5. Use LLM review for quality, risk, and product judgment — not for replacing tests.
6. When a repeated failure appears, update the harness changelog.

## Archon Notes

- Use `context: fresh` for eval nodes.
- Use `allowed_tools: [Bash]` so the node can read `$ARTIFACTS_DIR` correctly.
- Pi read/write tools may treat `$ARTIFACTS_DIR` literally. Prefer bash `cat` and redirection.
- Eval should write `EVAL.json` to artifacts and downstream nodes should read it via `jq`.

## Suggested Thresholds

- Ship only if requirements >= 8 and validation green.
- Fix if requirements 5-7 or review finds notable issues.
- Block if requirements < 5, artifacts missing, credentials missing, or unsafe operation required.

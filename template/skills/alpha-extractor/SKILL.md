# Alpha Extractor Skill

Use this skill when Adam pastes a YouTube/podcast/Substack/article link and asks for the "alpha", "cut the bullshit", "lessons", "what matters", "operator takeaways", "learn from this", or anything similar.

## Mission

Do **not** summarize. Extract the non-obvious, operator-useful signal:

- bottlenecks
- constraints
- leverage points
- asymmetries
- incentives
- arbitrage opportunities
- workflow implications
- Adam-specific lessons for Pi/Archon/local fleet/content studio/business/research

The user wants the sharp read, not a book report.

## Default Tool

Use the CLI extractor first:

```bash
chow-alpha "<URL>"
```

Useful variants:

```bash
# Extract transcript/metadata only, no LLM pass
chow-alpha --no-llm "<URL>"

# Force a different model
chow-alpha --model ollama/gemini-3-flash-preview:cloud "<URL>"

# For very long sources, chunk before synthesis
chow-alpha --max-full-words 40000 "<URL>"
```

Outputs go under:

```text
~/chow-work/alpha-extractor/reports/<timestamp>-<slug>/
├── metadata.json
├── source-info.json
├── transcript.txt
├── prompt.md or chunk prompts
└── alpha-report.md
```

After running, read `alpha-report.md` and give Adam a tight terminal-native answer. Include the file path.

## If the CLI Fails

Fallback extraction order:

1. `yt-dlp --dump-json --skip-download <URL>` for title/description/chapters.
2. `youtube_transcript_api` if YouTube transcript is reachable.
3. `yt-dlp --write-auto-sub --write-sub --skip-download` for captions.
4. Look in the video description for transcript/article links and fetch those.
5. If no transcript is available, tell Adam exactly what failed and ask for transcript, downloaded audio, or permission to run a local transcription path.

Do not hallucinate from title alone.

## Elite Output Format

When answering Adam directly, use this shape unless he asks otherwise:

```md
## TL;DR — No Bullshit
- ...

## The Actual Alpha
1. **Insight name**
   - What they said:
   - Why it matters:
   - Timestamp / receipt:
   - Adam translation:

## What Everyone Else Will Miss
- ...

## Lessons For Our Stack
- Agents / Pi / Archon:
- Video/content studio:
- Local fleet / compute:
- Business/research/investing:

## Bullshit / Low-Signal Parts
- ...

## Contrarian Check
- ...

## Content Angles
- ...

## Suggested Memory Updates
- Ask before saving durable memory unless Adam explicitly says save it.
```

## Style Rules

- Be direct, practical, and low-hype.
- Do not call generic summaries "alpha".
- Use timestamp receipts when available.
- Translate insight into Adam's operating reality.
- Separate "what they said" from "what we should do".
- Mark confidence when claims are speculative.
- For market/investing content, present educational analysis only; do not give financial advice.

## Adam Translation Heuristics

Map source insights into these local categories:

- **Agent systems**: skills, tools, workflows, memory, QA, adversarial review.
- **Archon/Pi**: DAG design, non-interactive Pi, model roles, tool permissions.
- **Local fleet**: Mac orchestrator, Dell/Hector renderer, Pipboy future inference, AWS orchestration.
- **Video studio**: source mining, narrative extraction, editorial packages, motion graphics, b-roll generation.
- **Content angles**: 30-60s hooks, explainers, contrarian takes, visual metaphors.
- **Business/research**: bottleneck analysis, capacity locking, supplier constraints, timing arbitrage.

## Quality Bar

A good Alpha Extractor result should make Adam say: "That saved me 2 hours and gave me 3 moves I would not have seen."
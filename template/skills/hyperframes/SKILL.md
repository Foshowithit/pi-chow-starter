---
name: hyperframes
description: |
  Knowledge skill for creating and editing Hyperframes video compositions.
  Use when building news shorts, editing index.html templates, running
  lint/inspect cycles, or computing phase transition timings. Covers the
  4-phase structure, animation system, timing math, and design rules.
---

# Hyperframes — Chow Video Pipeline Skill

This skill encodes everything needed to produce a Hyperframes Short video
from topic to preview. It replaces Cole's Claude `.claude/skills/diy-yt-creator/`
and `.claude/skills/hyperframes/` skills with Pi-compatible instructions.

## Video Pipeline Steps

The pipeline is 100% local, no cloud APIs, no Claude, no ElevenLabs:

1. **Copy template** → `cp -r test-video-template "videos/$SLUG"`
2. **Draft script** → 4-phase structure, ~2.3 words/sec pacing
3. **Generate TTS** → `python3 scripts/chow-edge-tts.py "videos/$SLUG" --shorts`
4. **Compute timings** → `python3 scripts/compute_timings.py "videos/$SLUG" --slam-word WORD`
5. **Edit index.html** → Replace content + wire timings
6. **Lint** → `npx hyperframes lint "videos/$SLUG"`
7. **Inspect** → `npx hyperframes inspect "videos/$SLUG"`
8. **Preview** → `npx hyperframes preview "videos/$SLUG"`
9. **Render** → `npx hyperframes render "videos/$SLUG" -o "videos/$SLUG/out/$SLUG.mp4"`

## 4-Phase Script Structure

Each phase is a narration block separated by a blank line:

```
[Phase 1: Hero hook — overline + secondary line + ALL-CAPS slam word + caption]

[Phase 2: Stat row — overline + headline + two stat pills with numbers]

[Phase 3: Analysis — overline + 2-3 labeled feature cards]

[Phase 4: CTA — overline + URL pill + subscribe prompt]
```

## Duration Math

- Target 30s → ~70 words of narration
- Target 45s → ~105 words
- Target 60s → ~140 words
- Speaking rate ≈ 2.3 words/sec with edge-tts at normal speed

## Phase Duration Guidelines (30s target)

| Phase | Share | Duration | Content |
|-------|-------|----------|---------|
| 1 (Hero) | ~22% | ~6.5s | Overline, secondary line, ONE slam word, caption pill |
| 2 (Stats) | ~22% | ~6.5s | Overline, headline, two stat pills |
| 3 (Cards) | ~33% | ~10s | Overline + 3 labeled cards |
| 4 (CTA) | ~17% | ~5s | Overline, URL pill, subscribe pill |
| Tail | ~6% | ~1.5s | Reading time on held final frame |

## Hero Word Fit Rule

At font-size 200px, a slam word must be ≤7 wide characters.
For 8-10 char words, reduce font-size to 160-180px.
The gradient text-fill (bright-blue→sky-blue) appears on AT MOST one element
per video — the hero slam word in Phase 1 only.

## Design Tokens (Classic Template)

| Role | Value |
|------|-------|
| Background | #0E1420 |
| Surface | #181F33 |
| Primary text | #E8E9F0 |
| Accent 1 (primary) | #4D8FF7 (bright blue) |
| Accent 2 (CTA) | #7AC4F5 (sky blue) |
| Accent 3 (bridge) | #8B7FE8 (soft indigo) |
| Accent 4 (workhorse) | #5EDBA4 (teal-green) |
| Sans font | Inter |
| Mono font | JetBrains Mono |

One accent per phase. Never two accent colors in the same phase.

## index.html Edit Checklist

When editing index.html for a new video, you MUST:

1. Replace `YOUR BRAND` in the top banner with topic-appropriate brand name
2. Replace `your-domain.com` in Phase 4 with a real or plausible URL
3. Replace Phase 1 overline text, secondary line, slam word, caption pill
4. Replace Phase 2 overline, headline, both stat pills (with REAL numbers)
5. Replace Phase 3 overline + 3 labeled feature cards
6. Replace Phase 4 overline, URL pill text, subscribe pill text
7. Update T1/T2/T3 phase transition timestamps from compute_timings output
8. Update P2/P3/P4 phase start animation delays
9. Update slam_t and shake_offsets from compute_timings output
10. Wire `<audio id="narration">` to `audio/narration.wav`
11. Verify all GSAP animation timestamps match the new timings

## Compute Timings Output Format

`compute_timings.py` outputs a JSON object with:
- T1, T2, T3: Phase transition anchors (seconds)
- P2, P3, P4: Phase start delays (seconds)
- slam_t: Time of the slam word (seconds)
- shake_offsets: Inline shake animation frames (array of {x, y, frame})

## Lint & Inspect

- `npx hyperframes lint "videos/$SLUG"` must report 0 errors
- `npx hyperframes inspect "videos/$SLUG"` must show no overflow
- Common lint errors: missing alt text, unclosed tags, timing misalignment
- Common overflow: hero word too wide (>7 chars at 200px), stat labels >18 chars

## TTS

We use `edge-tts` (free, local). The `chow-edge-tts.py` script:
- Accepts `--voice` flag (default: en-US-GuyNeural)
- Accepts `--rate` flag (default: +0%)
- Accepts `--shorts` flag for vertical video voice
- Produces `audio/narration.wav` (24kHz mono PCM)
- Produces `transcript.json` with word-level timestamps (approximated from sentence boundaries)

## What NOT To Do

1. Don't auto-render — user decides
2. Don't modify `test-video-template/` — only the copy
3. Don't use more than one gradient slam per video
4. Don't use `<br>` in content text — use `max-width`
5. Don't use `position: absolute; top: Npx` on `.phase-content`
6. Don't place text below 40px in accent colors
7. Don't use Archon cyan (#22D9A0) or magenta (#E64DCC) — wrong template
8. Don't use background music on Shorts — narration + SFX only
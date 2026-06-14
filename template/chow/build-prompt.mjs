#!/usr/bin/env node

/**
 * build-prompt.mjs — Assemble a lane-specific system prompt from memory files.
 *
 * Reads identity, active task, continuity capsule, summaries, playbook,
 * second-brain context, and checkpoints; redacts secrets; applies per-section
 * character limits; and writes a combined SYSTEM.generated.md.
 *
 * Usage:
 *   node build-prompt.mjs [--write <path>] [--manager-mode]
 *
 * Environment:
 *   CHOW_LANE                   Lane name (chow|hector|terminal-chow)
 *   CHOW_PROMPT_CHECKPOINTS_CHARS  Max chars for checkpoints (default 8000)
 *   MANAGER_MODE                When set, strips terminal/file-direct-use hints
 */

import { readFile, writeFile, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import { env, argv, exit, stdout } from "node:process";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const HOME = homedir();
const SESSION_DIR = join(HOME, ".pi", "agent", "chow-memory-v2");
const OUTPUT_PATH_DEFAULT = join(SESSION_DIR, "SYSTEM.generated.md");
const CHECKPOINT_PATH = join(SESSION_DIR, "checkpoints", "latest.md");
const LANES_DIR = join(HOME, "carl-bot", "memory"); // shared root

// Per-section maximum character counts
const LIMITS = {
  identity:    22_000,
  activeTask:   5_000,
  continuity:   9_000,
  summaries:   20_000,
  playbook:     8_000,
  secondBrain: 14_000,
  checkpoints:  8_000,
};

// ---------------------------------------------------------------------------
// Lane definitions
// ---------------------------------------------------------------------------
const LANES = {
  chow: {
    personaIntro:
      "You are Mr Chow — a brilliant, eccentric terminal agent with a flair for " +
      "the dramatic. You are deeply knowledgeable about systems, code, and " +
      "infrastructure, and you communicate with personality and precision. " +
      "You remember context across sessions and proactively anticipate needs. " +
      "Use terminal and file tools directly to accomplish tasks.",
    machineBlock:
      "### Machine Context\n" +
      "- **OS**: macOS / Linux (cross-platform)\n" +
      "- **Shell**: bash / zsh\n" +
      "- **Home**: " + HOME + "\n" +
      "- **Session**: ~/.pi/agent/chow-memory-v2/\n" +
      "Use terminal and file tools directly to inspect and modify the system.",
    memoryRoot: join(LANES_DIR, "chow"),
    chatId: "chow-terminal",
  },

  hector: {
    personaIntro:
      "You are Hector — a performance-focused GPU agent running on a Dell " +
      "machine via WSL2. You specialize in CUDA, PyTorch, model training, " +
      "and high-throughput data pipelines. You are concise, efficient, and " +
      "hardware-aware. Use terminal and file tools directly to accomplish tasks.",
    machineBlock:
      "### Machine Context\n" +
      "- **OS**: Ubuntu (WSL2 on Windows)\n" +
      "- **Hardware**: Dell with NVIDIA GPU (CUDA-capable)\n" +
      "- **Shell**: bash\n" +
      "- **Home**: " + HOME + "\n" +
      "Use terminal and file tools directly to inspect and modify the system.",
    memoryRoot: join(LANES_DIR, "hector"),
    chatId: "hector-wsl2",
  },

  "terminal-chow": {
    personaIntro:
      "You are a helpful terminal agent. You assist with system administration, " +
      "development, and automation tasks. You are professional, clear, and " +
      "precise. Use terminal and file tools directly to accomplish tasks.",
    machineBlock:
      "### Machine Context\n" +
      "- **OS**: Linux / macOS\n" +
      "- **Shell**: bash\n" +
      "- **Home**: " + HOME + "\n" +
      "- **Session**: ~/.pi/agent/chow-memory-v2/\n" +
      "Use terminal and file tools directly to inspect and modify the system.",
    memoryRoot: join(LANES_DIR, "terminal-chow"),
    chatId: "terminal-chow-session",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the resolved lane name from env or --lane flag. */
function resolveLane() {
  const flagIdx = argv.indexOf("--lane");
  if (flagIdx !== -1 && flagIdx + 1 < argv.length) {
    return argv[flagIdx + 1];
  }
  return env.CHOW_LANE || "chow";
}

/** Return true if --manager-mode was passed or MANAGER_MODE env is set. */
function isManagerMode() {
  return argv.includes("--manager-mode") || env.MANAGER_MODE === "1";
}

/**
 * Safely read a file; returns its contents as a string, or null if the file
 * doesn't exist or can't be read.
 */
async function tryRead(path) {
  try {
    await access(path);
    const content = await readFile(path, "utf-8");
    return content;
  } catch {
    return null;
  }
}

/**
 * Read a lane-specific file, falling back to a shared file in the memory root.
 * Priority: memory/<lane>/<name> → memory/<name>
 */
async function readLaneFile(laneName, fileName) {
  const lane = LANES[laneName];
  if (!lane) return null;

  const lanePath = join(lane.memoryRoot, fileName);
  const sharedPath = join(LANES_DIR, fileName);

  const laneContent = await tryRead(lanePath);
  if (laneContent !== null) return laneContent;

  const sharedContent = await tryRead(sharedPath);
  if (sharedContent !== null) return sharedContent;

  return null;
}

/** Read second-brain/context.md if it exists. */
async function readSecondBrain(laneName) {
  const lane = LANES[laneName];
  if (!lane) return null;
  const path = join(lane.memoryRoot, "second-brain", "context.md");
  return tryRead(path);
}

/**
 * Read the latest checkpoint file.
 * Returns content truncated to LIMITS.checkpoints chars.
 */
async function readCheckpoints(checkpointCharsLimit) {
  const content = await tryRead(CHECKPOINT_PATH);
  if (!content) return null;
  const maxChars = checkpointCharsLimit || LIMITS.checkpoints;
  if (content.length > maxChars) {
    return content.slice(0, maxChars) +
      `\n\n_[Checkpoint truncated at ${maxChars} characters — ` +
      `original was ${content.length} chars]_`;
  }
  return content;
}

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

/**
 * Redact sensitive patterns from a string.
 * Handles API keys, tokens, secrets, passwords, and private keys.
 */
function redact(text) {
  if (!text) return text;

  let result = text;

  // API keys: common formats like sk-..., pk-..., etc.
  result = result.replace(
    /(?:sk|pk|api|key|token|secret|bearer|auth)[-_]?(?:key|token)?[-_]?[A-Za-z0-9]{16,}/gi,
    (match) => {
      const prefix = match.slice(0, Math.min(6, match.length));
      return prefix + "*".repeat(Math.min(12, match.length - 6)) + "[REDACTED]";
    }
  );

  // OpenAI-style keys: sk-proj-... or sk-...
  result = result.replace(
    /sk-[A-Za-z0-9]{10,}(?:-[A-Za-z0-9]{10,})*/g,
    (match) => {
      const prefix = match.slice(0, 8);
      return prefix + "*".repeat(Math.min(12, match.length - 8)) + "[REDACTED]";
    }
  );

  // Bearer tokens in Authorization headers
  result = result.replace(
    /(Bearer\s+)[A-Za-z0-9._-]{20,}/gi,
    (_, bearer) => bearer + "[REDACTED]"
  );

  // Generic password / secret assignments
  result = result.replace(
    /(password|passwd|secret|PASSWORD|SECRET)\s*[:=]\s*\S{8,}/g,
    (_, label) => label + "=[REDACTED]"
  );

  // Private key blocks (PEM)
  result = result.replace(
    /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
    "[REDACTED PRIVATE KEY]"
  );

  // Generic token: any 40+ char hex string that looks like a hash/token
  result = result.replace(
    /\b[0-9a-fA-F]{40,}\b/g,
    (match) => match.slice(0, 8) + "*".repeat(12) + "[REDACTED]"
  );

  // URLs containing credentials (https://user:pass@host)
  result = result.replace(
    /(https?:\/\/)[^:]+:[^@]+@/g,
    "$1[REDACTED]:[REDACTED]@"
  );

  return result;
}

// ---------------------------------------------------------------------------
// Section building
// ---------------------------------------------------------------------------

/**
 * Truncate content to a maximum number of characters with a note.
 */
function truncate(content, maxChars, sectionLabel) {
  if (!content || content.length <= maxChars) return content || "";
  return content.slice(0, maxChars) +
    `\n\n_[${sectionLabel} truncated at ${maxChars} characters — ` +
    `original was ${content.length} chars]_`;
}

/**
 * Build a markdown section with a heading, optional emoji, and content.
 */
function section(heading, content) {
  if (!content || content.trim().length === 0) return "";
  return `## ${heading}\n\n${content.trim()}\n\n`;
}

// ---------------------------------------------------------------------------
// Strip terminal/file-direct-use hints in manager mode
// ---------------------------------------------------------------------------

function stripDirectUseHints(text) {
  if (!text) return text;
  // Remove "Use terminal and file tools directly" type sentences
  return text.replace(
    /Use\s+terminal\s+and\s+file\s+tools\s+directly\s+to\s+(accomplish\s+)?tasks?\.?/gi,
    ""
  ).replace(
    /Use\s+terminal\s+(and|or)\s+file\s+tools\s+directly\s+to\s+inspect\s+and\s+modify\s+the\s+system\.?/gi,
    ""
  ).replace(
    /\s{2,}/g, " "  // collapse multiple spaces
  ).trim();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // ----- Parse arguments ------------------------------------------------
  const writeIdx = argv.indexOf("--write");
  const outputPath = writeIdx !== -1 && writeIdx + 1 < argv.length
    ? argv[writeIdx + 1]
    : OUTPUT_PATH_DEFAULT;
  const managerMode = isManagerMode();
  const laneName = resolveLane();

  // Validate lane
  if (!LANES[laneName]) {
    console.error(
      `ERROR: Unknown lane "${laneName}". Valid lanes: ${Object.keys(LANES).join(", ")}`
    );
    exit(1);
  }

  const lane = LANES[laneName];
  const checkpointCharsLimit = parseInt(
    env.CHOW_PROMPT_CHECKPOINTS_CHARS || String(LIMITS.checkpoints),
    10
  );

  console.error(`=== build-prompt: Lane "${laneName}" (manager=${managerMode}) ===`);

  // ----- Read all memory files ------------------------------------------
  const [
    rawIdentity,
    rawActiveTask,
    rawContinuity,
    rawSummaries,
    rawPlaybook,
    rawSecondBrain,
    rawCheckpoints,
  ] = await Promise.all([
    readLaneFile(laneName, "identity.md"),
    readLaneFile(laneName, "active-task.md"),
    readLaneFile(laneName, "continuity-capsule.md"),
    readLaneFile(laneName, "summaries.md"),
    readLaneFile(laneName, "playbook.md"),
    readSecondBrain(laneName),
    readCheckpoints(checkpointCharsLimit),
  ]);

  // ----- Redact all content ---------------------------------------------
  let identity     = redact(rawIdentity);
  let activeTask   = redact(rawActiveTask);
  let continuity   = redact(rawContinuity);
  let summaries    = redact(rawSummaries);
  let playbook     = redact(rawPlaybook);
  let secondBrain  = redact(rawSecondBrain);
  let checkpoints  = redact(rawCheckpoints);

  // ----- Manager-mode stripping -----------------------------------------
  if (managerMode) {
    identity   = stripDirectUseHints(identity);
    lane.personaIntro = stripDirectUseHints(lane.personaIntro);
    lane.machineBlock = stripDirectUseHints(lane.machineBlock);
  }

  // ----- Apply per-section character limits -----------------------------
  identity    = truncate(identity,    LIMITS.identity,    "Identity");
  activeTask  = truncate(activeTask,  LIMITS.activeTask,  "Active Task");
  continuity  = truncate(continuity,  LIMITS.continuity,  "Continuity Capsule");
  summaries   = truncate(summaries,   LIMITS.summaries,   "Summaries");
  playbook    = truncate(playbook,    LIMITS.playbook,    "Playbook");
  secondBrain = truncate(secondBrain, LIMITS.secondBrain, "Second Brain");
  checkpoints = truncate(checkpoints, checkpointCharsLimit, "Checkpoints");

  // ----- Assemble the prompt --------------------------------------------
  const parts = [];

  // 1. Persona introduction
  parts.push(section("Persona", lane.personaIntro));

  // 2. Machine block
  parts.push(section("Machine", lane.machineBlock));

  // 3. Identity from memory
  if (identity) {
    parts.push(section("Identity & Background", identity));
  }

  // 4. Active task
  if (activeTask) {
    parts.push(section("Active Task", activeTask));
  }

  // 5. Continuity capsule
  if (continuity) {
    parts.push(section("Continuity Capsule", continuity));
  }

  // 6. Session summaries
  if (summaries) {
    parts.push(section("Session Summaries", summaries));
  }

  // 7. Playbook / SOPs
  if (playbook) {
    parts.push(section("Playbook", playbook));
  }

  // 8. Second brain context
  if (secondBrain) {
    parts.push(section("Second Brain Context", secondBrain));
  }

  // 9. Checkpoints
  if (checkpoints) {
    parts.push(section("Checkpoints", checkpoints));
  }

  const fullPrompt = parts.join("").trim() + "\n";

  // ----- Write output ---------------------------------------------------
  try {
    await writeFile(outputPath, fullPrompt, "utf-8");
    const lines = fullPrompt.split("\n").length;
    const chars = fullPrompt.length;
    console.error(
      `=== build-prompt: Wrote ${lines} lines, ${chars} chars → ${outputPath} ===`
    );
  } catch (err) {
    console.error(`ERROR: Failed to write prompt to ${outputPath}: ${err.message}`);
    exit(1);
  }
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  exit(1);
});

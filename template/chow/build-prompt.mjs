#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HOME = os.homedir();
const CHAT_ID = process.env.CHOW_CHAT_ID || "-1003665370879";
const DEFAULT_MEMORY_ROOTS = [
  path.join(HOME, "carl-bot", "memory"),
];
const MEMORY_ROOT = process.env.CHOW_MEMORY_ROOT || DEFAULT_MEMORY_ROOTS.find((root) => {
  return fs.existsSync(path.join(root, CHAT_ID, "identity.md"));
}) || DEFAULT_MEMORY_ROOTS[0];
const CHAT_DIR = path.join(MEMORY_ROOT, CHAT_ID);

const MAX = {
  identity: Number(process.env.CHOW_PROMPT_IDENTITY_CHARS || 22000),
  activeTask: Number(process.env.CHOW_PROMPT_ACTIVE_TASK_CHARS || 5000),
  continuity: Number(process.env.CHOW_PROMPT_CONTINUITY_CHARS || 9000),
  summaries: Number(process.env.CHOW_PROMPT_SUMMARIES_CHARS || 14000),
  playbook: Number(process.env.CHOW_PROMPT_PLAYBOOK_CHARS || 8000),
  secondBrain: Number(process.env.CHOW_PROMPT_SECOND_BRAIN_CHARS || 14000),
};

function read(file) {
  try {
    const text = fs.readFileSync(file, "utf8").trim();
    return redact(text);
  } catch {
    return "";
  }
}

function redact(text) {
  return text
    .replace(/sk-(live|test|proj|ant|or|)[A-Za-z0-9_\-]{16,}/g, "[REDACTED_API_KEY]")
    .replace(/xox[baprs]-[A-Za-z0-9\-]{16,}/g, "[REDACTED_SLACK_TOKEN]")
    .replace(/gh[pousr]_[A-Za-z0-9_]{16,}/g, "[REDACTED_GITHUB_TOKEN]")
    .replace(/(?<=api[_-]?key\s*[:=]\s*)[A-Za-z0-9_\-.]{16,}/gi, "[REDACTED]")
    .replace(/(?<=secret\s*[:=]\s*)[A-Za-z0-9_\-.]{16,}/gi, "[REDACTED]");
}

function limit(text, max, label) {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}\n\n[${label} truncated at ${max} chars by Chow CLI prompt builder]`;
}

function newestFiles(dir, n, suffix = ".md") {
  try {
    return fs.readdirSync(dir)
      .filter((name) => name.endsWith(suffix))
      .sort()
      .slice(-n)
      .map((name) => path.join(dir, name));
  } catch {
    return [];
  }
}

function buildSecondBrain() {
  const parts = [];
  const context = read(path.join(CHAT_DIR, "second-brain", "context.md"));
  if (context) parts.push(`# Existing Second-Brain Context\n\n${context}`);

  const consolidated = newestFiles(path.join(CHAT_DIR, "second-brain", "consolidated"), 3)
    .map((file) => `## ${path.basename(file)}\n\n${read(file)}`)
    .filter(Boolean)
    .join("\n\n---\n\n");
  if (consolidated) parts.push(`# Recent Consolidated Brain Logs\n\n${consolidated}`);

  return limit(parts.join("\n\n---\n\n"), MAX.secondBrain, "second-brain");
}

function section(title, body) {
  if (!body?.trim()) return "";
  return `## ${title}\n\n${body.trim()}`;
}

// ---- Main ----
const identity = read(path.join(CHAT_DIR, "identity.md"));
const activeTask = limit(read(path.join(CHAT_DIR, "active-task.md")), MAX.activeTask, "active-task");
const continuity = limit(read(path.join(CHAT_DIR, "continuity-capsule.md")), MAX.continuity, "continuity-capsule");
const summaries = limit(read(path.join(CHAT_DIR, "summaries.md")), MAX.summaries, "summaries");
const playbook = limit(read(path.join(CHAT_DIR, "playbook.md")), MAX.playbook, "playbook");
const secondBrain = buildSecondBrain();
const dsflashMode = process.env.CHOW_DSFLASH_MODE === "1";

const sections = [
  identity,
  section("Active Task", activeTask),
  section("Continuity Capsule", continuity),
  section("Recent Conversation Summaries", summaries),
  section("Learned Playbook", playbook),
  section("Second Brain Context", secondBrain),
].filter(Boolean);

let prompt = sections.join("\n\n");

if (dsflashMode) {
  const dsflashPrompt = read(path.join(HOME, ".pi", "agent", "prompts", "dsflashmode.md"));
  if (dsflashPrompt) {
    prompt += `\n\n${dsflashPrompt}`;
  }
}

const WRITE_FLAG = process.argv.includes("--write");
if (WRITE_FLAG) {
  const writeIdx = process.argv.indexOf("--write") + 1;
  const outPath = process.argv[writeIdx];
  if (outPath && !outPath.startsWith("--")) {
    fs.writeFileSync(outPath, prompt, "utf8");
    process.stdout.write(`Prompt built: ${prompt.length} chars → ${outPath}\n`);
    process.exit(0);
  }
}

process.stdout.write(prompt);

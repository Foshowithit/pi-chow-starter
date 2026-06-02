#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HOME = os.homedir();
const CHAT_ID = process.env.CHOW_CHAT_ID || "-1003665370879";
const DEFAULT_MEMORY_ROOTS = [
	path.join(HOME, "carl-bot", "memory"),
	path.join(HOME, "hector-telegram-bot", "memory"),
];
const MEMORY_ROOT =
	process.env.CHOW_MEMORY_ROOT ||
	DEFAULT_MEMORY_ROOTS.find((root) => {
		return fs.existsSync(path.join(root, CHAT_ID, "identity.md"));
	}) ||
	DEFAULT_MEMORY_ROOTS[0];
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
		.replace(
			/sk-(live|test|proj|ant|or|)[A-Za-z0-9_-]{16,}/g,
			"[REDACTED_API_KEY]",
		)
		.replace(/xox[baprs]-[A-Za-z0-9-]{16,}/g, "[REDACTED_SLACK_TOKEN]")
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
		return fs
			.readdirSync(dir)
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

	const consolidated = newestFiles(
		path.join(CHAT_DIR, "second-brain", "consolidated"),
		3,
	)
		.map((file) => `## ${path.basename(file)}\n\n${read(file)}`)
		.filter(Boolean)
		.join("\n\n---\n\n");
	if (consolidated)
		parts.push(`# Recent Consolidated Brain Logs\n\n${consolidated}`);

	return limit(parts.join("\n\n---\n\n"), MAX.secondBrain, "second-brain");
}

function section(title, body) {
	if (!body?.trim()) return "";
	return `## ${title}\n\n${body.trim()}`;
}

const identityPath = path.join(CHAT_DIR, "identity.md");
const activeTaskPath = path.join(CHAT_DIR, "active-task.md");
const continuityPath = path.join(CHAT_DIR, "continuity-capsule.md");
const summariesPath = path.join(CHAT_DIR, "summaries.md");
const playbookPath = path.join(CHAT_DIR, "playbook.md");
const secondBrainDir = path.join(CHAT_DIR, "second-brain");

const identity = limit(read(identityPath), MAX.identity, "identity");
const activeTask = limit(read(activeTaskPath), MAX.activeTask, "active task");
const continuity = limit(
	read(continuityPath),
	MAX.continuity,
	"continuity capsule",
);
const summaries = limit(read(summariesPath), MAX.summaries, "summaries");
const playbook = limit(read(playbookPath), MAX.playbook, "playbook");
const secondBrain = buildSecondBrain();

const machineBlock = `- Host mode: Chow CLI on Adam's Mac terminal, launched through \`~/.pi/agent/bin/chow\`.
- This is NOT Telegram. Do not act constrained by Telegram message formatting or bot commands.
- Normal Pi session controls apply: \`/new\`, \`/resume\`, \`/session\`, \`/tree\`, \`/fork\`, \`/clone\`, \`/compact\`, \`/model\`.
- Chow CLI sessions are isolated under \`${process.env.CHOW_CLI_SESSION_DIR || path.join(HOME, ".pi", "agent", "sessions", "chow-terminal")}\`.
- Current working directory is whatever directory Adam launches \`chow\` from; inspect it before making project assumptions.
- Use terminal/file tools directly. Prefer verified command output over memory when they disagree.
- Remote fleet access may require SSH/Tailscale credentials; if access fails, report exact failure and next fix.`;

const dsFlashMode = String(process.env.CHOW_DSFLASH_MODE || "").trim() === "1";
const managerMode = String(process.env.CHOW_MANAGER_MODE || "").trim() === "1";

const dsFlashWorkerBlock = dsFlashMode
	? `## DS Flash Worker Mode

You are running in Chow DS Flash worker mode. Stay the main foreman: keep final judgment, safety, sequencing, memory, and the user-facing answer. Use fast bounded DS Flash workers for parallelizable work by running terminal helpers through bash:

- Coding/debugging/repo scan/test worker: \`chow-worker coder "<precise bounded task>"\`
- Research/docs/comparison/investigation worker: \`chow-worker researcher "<precise bounded task>"\`

Give workers exact paths, constraints, expected output, and what not to touch. Treat their output as draft findings and review it before acting. Do not delegate secrets handling, destructive cleanup, production restarts, DNS/cutovers, or anything requiring Adam's approval.

Default worker model: \`${process.env.CHOW_WORKER_MODEL || "opencode-go/deepseek-v4-flash"}\`.`
	: "";

const managerModeBlock = managerMode
	? `- 🔴 MANAGER MODE: All execution must be delegated via subagents. You have no file, command, or search tools — only subagent/intercom/switch_model/pi_messenger/analyze_image/structured_return/review_loop. Parallelize independent tasks; serialize code edits. Default worker: \`${process.env.CHOW_WORKER_MODEL || "opencode-go/deepseek-v4-flash"}\`.`
	: "";

const memoryBlock = `Memory source is the local Chow mirror at \`${CHAT_DIR}\`.

Files you may update with tools:
1. Identity / durable facts: \`${identityPath}\`
2. Active task / live work state: \`${activeTaskPath}\`
3. Continuity capsule: \`${continuityPath}\`
4. Summaries / rolling memory: \`${summariesPath}\` (usually do not hand-edit unless asked)
5. Playbook: \`${playbookPath}\`
6. Second brain dir: \`${secondBrainDir}\`

When Adam gives durable new facts, decisions, project status, machine info, credentials locations (never secret values), or strong preferences, update the relevant local memory file immediately. Keep identity concise and under control; use active-task for temporary multi-step work.

Write-back rules:
- Prefer the structured edit/write tools when available; otherwise use a safe temp-file + mv pattern in bash.
- Do not blind-sync remote memory over local memory. \`chow-sync-memory\` protects divergent files by default; use \`--pull-conflicts\` to copy AWS/Rico versions into timestamped sidecars for manual merge.
- Never print or persist secret values. Store credential locations only, redact token/key values, and keep shell configs secret-free.
- For large memory changes, update \`continuity-capsule.md\` with the current state and leave \`summaries.md\` to automated/session-summary flows unless Adam explicitly asks.
- After memory edits, regenerate the prompt with: \`node ~/.pi/agent/chow/build-prompt.mjs --write ~/.pi/agent/chow/SYSTEM.generated.md >/dev/null\`.`;

const prompt = `You are Mr Chow, Adam's terminal-native Pi agent.

You are the same operational/coding/research assistant persona as Chow from the Telegram system, but this runtime is a first-class CLI lane: fast, direct, practical, and able to start/resume/fork normal Pi sessions from the terminal.

## Terminal Runtime

${machineBlock}

## Operating Style

- Be direct, useful, and low-hype.
- Move work forward with concrete commands and reversible edits.
- If something is ambiguous, choose the safest reasonable path and state the assumption.
- Keep Jose/Hector/Chow lanes separate unless Adam explicitly asks to bridge them.
- Do not print, commit, or unnecessarily read secrets. Redact sensitive values in summaries.
- Do not restart/delete/modify production resources unless Adam clearly asks or confirms.
- Use memory as context, not gospel. Fresh command output wins.
${managerModeBlock ? managerModeBlock + "\n" : ""}

${section("Chow Identity & Core Memory", identity || "(No identity.md found in local memory mirror.)")}

${section("Active Task", activeTask)}

${section("Continuity Capsule", continuity)}

${section("Recent Conversation Summaries", summaries)}

${section("Learned Playbook", playbook)}

${section("Chow Second Brain Context", secondBrain)}
${dsFlashWorkerBlock ? dsFlashWorkerBlock + "\n\n" : ""}---

## Memory Instructions

${memoryBlock}

## CLI-Specific Promise

Adam wants Chow available in the terminal like Pi: easy new sessions, resume old sessions, and no need to use Telegram. Treat this wrapper as Chow's primary local terminal lane.`;

const args = process.argv.slice(2);
const writeIndex = args.indexOf("--write");
if (writeIndex >= 0) {
	const next = args[writeIndex + 1];
	const out =
		next && !next.startsWith("--")
			? next
			: path.join(HOME, ".pi", "agent", "chow", "SYSTEM.generated.md");
	fs.mkdirSync(path.dirname(out), { recursive: true });
	fs.writeFileSync(out, prompt.trim() + "\n", "utf8");
}

process.stdout.write(prompt.trim() + "\n");

#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HOME = os.homedir();

const DEFAULT_MEMORY_ROOTS = [
	path.join(HOME, "carl-bot", "memory"),
	path.join(HOME, "hector-telegram-bot", "memory"),
];

// ── Lane configuration ──────────────────────────────────────────────────

const LANES = {
	chow: {
		persona: "Mr Chow",
		laneLabel: "Chow CLI",
		memoryRootDefault: path.join(HOME, "carl-bot", "memory"),
		chatId: "-1003665370879",
		sectionPrefix: "Chow",
		machineBlock: `- Host mode: Chow CLI on Adam's Mac terminal, launched through \`~/.pi/agent/bin/chow\`.
- This is NOT Telegram. Do not act constrained by Telegram message formatting or bot commands.
- Normal Pi session controls apply: \`/new\`, \`/resume\`, \`/session\`, \`/tree\`, \`/fork\`, \`/clone\`, \`/compact\`, \`/model\`.
- Chow CLI sessions are isolated under \`${process.env.CHOW_CLI_SESSION_DIR || path.join(HOME, ".pi", "agent", "sessions", "chow-terminal")}\`.
- Current working directory is whatever directory Adam launches \`chow\` from; inspect it before making project assumptions.
- Use terminal/file tools directly. Prefer verified command output over memory when they disagree.
- Remote fleet access may require SSH/Tailscale credentials; if access fails, report exact failure and next fix.`,
		personaIntro: `You are Mr Chow, Adam's terminal-native Pi agent.

You are the same operational/coding/research assistant persona as Chow from the Telegram system, but this runtime is a first-class CLI lane: fast, direct, practical, and able to start/resume/fork normal Pi sessions from the terminal.`,
	},
	hector: {
		persona: "Hector",
		laneLabel: "Hector Dell GPU Agent",
		memoryRootDefault: path.join(HOME, "carl-bot", "memory"), // shared until separate lane files exist
		chatId: "-1003665370879",
		sectionPrefix: "Hector",
		machineBlock: `- Host mode: Hector/Dell WSL2 GPU render lane, launched from \`~/.pi/agent/bin/chow --lane hector\`.
- Target machine: \`/home/adam\` on Dell WSL2 with NVIDIA GPU (RTX 4090).
- Focus: Wan2.1 video generation and Remotion rendering pipeline.
- This is NOT Telegram. Do not act constrained by Telegram message formatting or bot commands.
- Normal Pi session controls apply: \`/new\`, \`/resume\`, \`/session\`, \`/tree\`, \`/fork\`, \`/clone\`, \`/compact\`, \`/model\`.
- Hector CLI sessions are isolated under \`${process.env.CHOW_CLI_SESSION_DIR || path.join(HOME, ".pi", "agent", "sessions", "hector-terminal")}\`.
- Current working directory is the project root on Dell WSL2; inspect it before making project assumptions.
- Use terminal/file tools directly over SSH or Tailscale. Prefer verified command output over memory when they disagree.
- Remote fleet access may require SSH/Tailscale credentials; if access fails, report exact failure and next fix.`,
		personaIntro: `You are Hector, Adam's Dell WSL2 GPU render agent.

You are a specialised assistant focused on Wan2.1 video generation and Remotion rendering. This runtime is a first-class CLI lane: fast, direct, practical, and able to start/resume/fork normal Pi sessions from the terminal.`,
	},
};

function resolveLane() {
	// Default from env var or chow
	let lane = process.env.CHOW_LANE || "chow";
	// CLI --lane flag overrides env var
	const args = process.argv.slice(2);
	const laneIndex = args.indexOf("--lane");
	if (
		laneIndex >= 0 &&
		args[laneIndex + 1] &&
		!args[laneIndex + 1].startsWith("--")
	) {
		lane = args[laneIndex + 1];
	}
	if (!LANES[lane]) {
		console.error(
			`Unknown lane "${lane}". Valid lanes: ${Object.keys(LANES).join(", ")}`,
		);
		process.exit(1);
	}
	return lane;
}

const lane = resolveLane();
const cfg = LANES[lane];

// Allow env override of memory root for any lane
const MEMORY_ROOT =
	process.env.CHOW_MEMORY_ROOT ||
	DEFAULT_MEMORY_ROOTS.find((root) => {
		return fs.existsSync(path.join(root, cfg.chatId, "identity.md"));
	}) ||
	cfg.memoryRootDefault;

const CHAT_DIR = path.join(MEMORY_ROOT, cfg.chatId);

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

// ── Lane-specific file overlays ──────────────────────────────────────────
// Shared base files live in CHAT_DIR. Lane-specific overlays live in
// CHAT_DIR/lanes/{lane}/. When a lane overlay exists, overlay content
// appears FIRST (with a clear header), then shared content follows.
// Under section limits, the full overlay is preserved; shared content
// is truncated only if needed, with an explicit notice.

function readWithLaneOverlay(basename, maxKey, label) {
	const shared = read(path.join(CHAT_DIR, basename));
	const laneFile = path.join(CHAT_DIR, "lanes", lane, basename);
	const overlay = read(laneFile);
	const max = MAX[maxKey];

	if (!overlay) return limit(shared, max, label);
	if (!shared) return limit(overlay, max, `${cfg.sectionPrefix} lane overlay (${label})`);

	// Overlay content appears BEFORE shared content, with clear headers
	const overlaySection = `### ${cfg.sectionPrefix} — Lane-Specific\n\n${overlay}`;
	const sharedSection = `### Shared Base\n\n${shared}`;
	const divider = "\n\n---\n\n";

	// If overlay alone exceeds max, truncate overlay with explicit notice
	if (overlaySection.length > max) {
		return limit(overlaySection, max, `${cfg.sectionPrefix} lane overlay (${label})`);
	}

	// If combined fits entirely, return all
	const combined = overlaySection + divider + sharedSection;
	if (combined.length <= max) return combined;

	// Overlay fits; shared base needs truncation.
	// Preserve full overlay, include as much shared as fits.
	const truncationNotice = `\n\n[Shared base truncated to fit section limit. Lane overlay preserved in full.]`;
	const sharedBudget = max - overlaySection.length - divider.length - truncationNotice.length;
	if (sharedBudget <= 0) {
		return overlaySection + truncationNotice;
	}
	const truncatedShared = sharedSection.slice(0, Math.max(0, sharedBudget)).trimEnd();
	return overlaySection + divider + truncatedShared + truncationNotice;
}

const identityPath = path.join(CHAT_DIR, "identity.md");
const activeTaskPath = path.join(CHAT_DIR, "active-task.md");
const continuityPath = path.join(CHAT_DIR, "continuity-capsule.md");
const summariesPath = path.join(CHAT_DIR, "summaries.md");
const playbookPath = path.join(CHAT_DIR, "playbook.md");
const secondBrainDir = path.join(CHAT_DIR, "second-brain");

const identity = readWithLaneOverlay("identity.md", "identity", "identity");
const activeTask = readWithLaneOverlay("active-task.md", "activeTask", "active task");
const continuity = readWithLaneOverlay("continuity-capsule.md", "continuity", "continuity capsule");
const summaries = readWithLaneOverlay("summaries.md", "summaries", "summaries");
const playbook = readWithLaneOverlay("playbook.md", "playbook", "playbook");
const secondBrain = buildSecondBrain();

const machineBlock = cfg.machineBlock;

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

const memoryBlock = `Memory source is the local ${cfg.laneLabel} mirror at \`${CHAT_DIR}\`.

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

const laneSpecificNote = (() => {
	const laneDir = path.join(CHAT_DIR, "lanes", lane);
	if (fs.existsSync(laneDir)) {
		return `\n\nLane-specific memory files are available under \`${laneDir}/\` and are overlaid on top of the shared base files.`;
	}
	return "";
})();

const prompt = `${cfg.personaIntro}

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

${section(`${cfg.sectionPrefix} Identity & Core Memory`, identity || `(No identity.md found in local memory mirror.)`)}

${section("Active Task", activeTask)}

${section("Continuity Capsule", continuity)}

${section("Recent Conversation Summaries", summaries)}

${section("Learned Playbook", playbook)}

${section(`${cfg.sectionPrefix} Second Brain Context`, secondBrain)}
${dsFlashWorkerBlock ? dsFlashWorkerBlock + "\n\n" : ""}---
## Memory Instructions

${memoryBlock}${laneSpecificNote}

## CLI-Specific Promise

Adam wants ${cfg.persona} available in the terminal like Pi: easy new sessions, resume old sessions, and no need to use Telegram. Treat this wrapper as ${cfg.persona}'s primary local terminal lane.`;

// ── Stats / check mode ──────────────────────────────────────────────────

const args = process.argv.slice(2);
const statsMode = args.includes("--stats") || args.includes("--check");

if (statsMode) {
	const sections = [
		{ name: `${cfg.sectionPrefix} Identity & Core Memory`, content: identity },
		{ name: "Active Task", content: activeTask },
		{ name: "Continuity Capsule", content: continuity },
		{ name: "Recent Conversation Summaries", content: summaries },
		{ name: "Learned Playbook", content: playbook },
		{ name: `${cfg.sectionPrefix} Second Brain Context`, content: secondBrain },
	];

	console.log(`\n=== Lane: ${lane} (${cfg.laneLabel}) ===`);
	console.log(`Memory root: ${MEMORY_ROOT}`);
	console.log(`Chat dir: ${CHAT_DIR}`);
	console.log(`\nSection stats:\n`);
	console.log(
		`${"Section".padEnd(38)} ${"Chars".padEnd(8)} ${"Est.Tokens".padEnd(12)} ${"Status"}`,
	);
	console.log("-".repeat(72));

	let totalChars = 0;
	let hasWarning = false;
	for (const s of sections) {
		const chars = s.content ? s.content.length : 0;
		const estTokens = Math.ceil(chars / 4);
		totalChars += chars;
		const status = estTokens > 12000 ? "⚠️ OVER 12K" : "OK";
		if (estTokens > 12000) hasWarning = true;
		console.log(
			`${s.name.padEnd(38)} ${String(chars).padEnd(8)} ${String(estTokens).padEnd(12)} ${status}`,
		);
	}
	console.log("-".repeat(72));
	console.log(
		`${"TOTAL".padEnd(38)} ${String(totalChars).padEnd(8)} ${String(Math.ceil(totalChars / 4)).padEnd(12)}`,
	);
	if (hasWarning) {
		console.log(
			"\n⚠️  WARNING: Some sections exceed 12,000 estimated tokens. Consider reducing content.",
		);
	}
	console.log("");
	process.exit(0);
}

// ── Write mode ──────────────────────────────────────────────────────────

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

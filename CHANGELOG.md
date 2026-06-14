# Changelog

## 0.2.0 (2026-06-14)

### Added
- Checkpoint system for session continuity (`chow-checkpoint`)
- Memory OS v2 with automated daily consolidation
- Telemetry system for session analytics
- Commands framework (`chow/commands/`)
- `terminal-chow` lane for isolated finance terminal sessions
- VERSION, CHANGELOG.md, CONTRIBUTING.md files

### Changed
- Default model routing: DS Flash 3 → DeepSeek V4 Pro/Flash via OpenCode-Go
- `build-prompt.mjs`: checkpoint injection, lane-aware prompt assembly
- `bin/chow`: manager-mode tool stripping, expanded help, lane support
- Model router, settings, compaction policy updated for current providers
- Professionalized README with badges, architecture diagram, clean comparison
- All documentation polished for professional presentation

### Fixed
- Subagent artifact path resolution for isolated session buckets
- Model router fallback chains for rate-limit resilience
- Memory file redaction for API keys in prompt builder

## 0.1.0 (2026-06-03)

### Added
- Initial public release
- Manager + subagent delegation pattern
- Memory OS with identity/active-task/continuity/playbook files
- 3 core agents: Coder, Auditor, Mac Operator
- 10 custom skills
- Model router with 3 profiles
- Dynamic prompt builder with lane awareness
- One-line install via curl | bash

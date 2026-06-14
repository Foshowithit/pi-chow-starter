# Contributing

## Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've changed APIs or file layouts, update the relevant documentation.
3. Ensure shell scripts pass shellcheck and markdown is well-formatted.
4. Open a PR with a clear title and description.

## Development Setup

```bash
git clone https://github.com/Foshowithit/pi-chow-starter.git
cd pi-chow-starter
bash install.sh --force
```

## Code Style

- Shell scripts: `bash` with `set -euo pipefail`, shellcheck-clean
- JSON configs: 2-space indentation, trailing newline
- Markdown: ATX headers, wrap at 80 chars
- Agent definitions: follow existing template structure

## License

MIT

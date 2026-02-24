# ✨ glitz

Engaging terminal visualizations for your git repo's commit history.

## Install

```bash
npm install -g glitz
```

Or run directly with npx:

```bash
npx glitz heroes
```

## Usage

```
glitz <command> [options]

Commands:
  glitz heroes [path]  Show a ranked leaderboard of repo contributors

Options:
  -h, --help     Show help
  -v, --version  Show version number
```

### heroes

Displays a ranked leaderboard of contributors with commit counts, lines added/removed, and colorful bar charts.

```bash
# Run in the current directory
glitz heroes

# Point at a specific repo
glitz heroes /path/to/repo

# Show top 5, sorted by lines added
glitz heroes --limit 5 --sort insertions

# Only commits from the last 3 months
glitz heroes --since "3 months ago"

# Include merge commits
glitz heroes --include-merges

# Output raw JSON data
glitz heroes --json
```

**Options:**

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--limit` | `-l` | Number of authors to display | `10` |
| `--sort` | `-s` | Sort by: `commits`, `insertions`, `deletions`, `net` | `commits` |
| `--since` | | Only count commits after date (e.g., `"3 months ago"`) | |
| `--include-merges` | | Include merge commits in statistics | `false` |
| `--json` | | Output raw intermediate data as JSON | `false` |

**Example output:**

```
✨ Repo Heroes — my-project (main)
────────────────────────────────────────────────────────────
🥇 Alice Chen          █████████████████████████  142 commits  +12,340  -3,201
🥈 Bob Martinez        ████████████████████       98 commits   +8,102   -2,444
🥉 Carol Park          █████████████              61 commits   +4,320   -1,100
 4 Dave Flynn          ██████████                 47 commits   +3,010   -890
 5 Eve Johnson         ████████                   35 commits   +2,100   -560
────────────────────────────────────────────────────────────
   5 contributors | 383 commits | +29,872 | -8,195
```

## Adding New Visualizations

Glitz is designed to be extensible. To add a new visualization:

1. Create a new file in `src/visualizations/` (e.g., `timeline.ts`)
2. Export a function matching the `Visualization` type signature
3. Register it in `src/visualizations/index.ts`
4. Add a yargs subcommand in `src/cli.ts`

## Author Deduplication with `.mailmap`

Glitz uses git's `%aN` / `%aE` format specifiers, which respect your repo's `.mailmap` file. If the same person has committed under different names or emails, create a `.mailmap` file in your repo root to unify them:

```
Alice Chen <alice@company.com> <alice.old@gmail.com>
Alice Chen <alice@company.com> <achen@users.noreply.github.com>
```

See [git-mailmap docs](https://git-scm.com/docs/gitmailmap) for details.

## Disabling Colors

Glitz respects the `NO_COLOR` environment variable. To disable colored output:

```bash
NO_COLOR=1 glitz heroes
```

## Development

```bash
# Install dependencies
npm install

# Run in dev mode (no build step)
npm run dev -- heroes /path/to/repo

# Build
npm run build

# Run tests
npm test

# Link globally for testing
npm link
glitz heroes
```

## Requirements

- Node.js >= 16
- Git (must be available in PATH)

## License

MIT

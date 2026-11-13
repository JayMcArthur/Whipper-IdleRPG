# Whipper Wiki

Static game reference and beginner guides for [Whipper](https://play.google.com/store/apps/details?id=jp.haappss.whipper), published at https://jaymcarthur.github.io/Whipper-IdleRPG/.

## Build

Nix provisions the locked Node 24.21.0/npm 11.19.0 environment. Run these commands from each checkout/worktree:

```sh
./scripts/dev.sh -- npm ci
./scripts/dev.sh -- npm run check
./scripts/dev.sh -- npm run build
./scripts/dev.sh -- npm run dev
```

The development URL includes `/Whipper-IdleRPG/`. `npm run build` generates only the public site in `agent-output/dist/`, checks links/assets and verifies the publication allowlist. It does not publish. In a managed workspace, queue dependency installation, builds and browser checks with `workspace heavy run`.

Browser checks use the repository's pinned Chromium:

```sh
./scripts/dev.sh --browser -- npm run test:browser
```

The dev/preview commands use Astro’s foreground mode (`--ignore-lock`) so process owners can stop them. The Playwright server starts and stops automatically. Browser profiles use a short Unix-path alias to task-owned temporary output, avoiding Chromium socket-path limits inside Nix; both are removed after the run. Screenshots and test results go in `agent-output/`. Generated `node_modules/` and `.astro/` state is disposable and must not be committed. Managed task output has a personal Git exclusion; keep project plans and human reports in SilverBullet.

## Source

- `src/`: static Astro pages/layouts, public reference model, search and locale UI.
- `src/content/guides/`: English editorial guides. Other language interfaces identify English guide text explicitly.
- `data/`: public game tables and translations; `data/snapshot.json` records provenance and coverage.
- `assets/`: public game artwork/icons and branding.
- `src/lib/game/`: one public stat, comparison, dungeon-layout and encounter-benchmark model.
- `src/client/lab/` and `src/components/lab/`: build editor, item graphs, dungeon tester and browser-local Item Book.
- `scripts/game-import.mjs`: validated JSON/CSV updates, change review and snapshot provenance.
- `scripts/prepare.mjs`: explicit publication allowlist and redirects for old `.html` links.
- `old/` and `Python Scripts/`: historical reference; excluded from the published site.

The wiki has no save upload, decoder, encoder, private keys, raw app packages or real player saves. Those belong to a separate private processor project. Keep confidential material out of source, build artifacts and browser code.

## Updating game tables and spreadsheet exports

Put changed public tables in a directory outside source, such as `agent-output/game-import/`. Supported filenames are `equips`, `customs`, `monsters`, `materials` and `dungeons`, each as `.json` or `.csv`, plus optional `langs.csv`. A JSON file has the game's normal top-level table name. CSV exports use the exact game field names as headers; a dungeon's `monsters` cell contains a JSON floor-to-IDs object. Export spreadsheet **data tabs**, not calculated display tables. Formula text is never executed. Import one changed table or a complete export; unchanged tables remain in the validated combined snapshot.

```sh
./scripts/dev.sh -- npm run import:game -- --input agent-output/game-import --version 7.3.2 --build 143 --captured-at 2026-11-14
# Review added/changed/removed IDs and warnings, then apply the same import:
./scripts/dev.sh -- npm run import:game -- --input agent-output/game-import --version 7.3.2 --build 143 --captured-at 2026-11-14 --apply
./scripts/dev.sh -- npm run check
./scripts/dev.sh -- npm run build
```

The version/build/date above are examples; use the actual captured version. The default command is a dry run. Required fields, types, duplicate IDs, equipment kinds, ability/evolution/set/drop links and prerequisite references are checked before any source write. Unknown columns require an explicit public-data contract review. Source terminal enchantment pointers beyond the last recorded level produce a warning rather than a fabricated level.

For new images, add `--assets DIRECTORY` with public PNGs under `icons/` or `dungeons/`. Required images must already exist or be supplied; icons cannot reference arbitrary filesystem paths. Only required public PNGs are copied. Import metadata records counts, hashes, previous version and changed IDs in `data/snapshot.json`; the coverage page reads it directly.

New item records automatically appear in reference routes/search, build selectors, graphs/comparison and the Item Book. New effect values/descriptions use the selected actual record, including localized `{value}` substitution. New gameplay mechanics still need a reviewed model rule; a new numeric row cannot establish an unknown combat behavior.

## Tool model and local records

See [the model contract](docs/game-model.md) for supported arithmetic, workbook sources and encounter-test limits. Graphs regenerate from the current imported tables, not historical spreadsheet chart caches. Their score weights are visible and editable.

Old `.html` tool URLs redirect into the shared lab. Existing `whipper-builds-v4` and `whipper-item-book` records are read once into their respective current keys; the originals remain unchanged. New presets store actual game ability IDs. Export JSON from the lab before clearing browser data. This preset JSON is separate from a native game save.

## Publishing

The current Pages site publishes the root of `main`. This Astro version must be deployed as the **built output**, not by copying private/local source into that branch. The reviewed workflow supports manual Pages publication from `main` after changing the Pages publishing source to GitHub Actions. A code commit/build is not deployment approval. Preserve the existing URL, existing player browser storage and old `.html` entry links.

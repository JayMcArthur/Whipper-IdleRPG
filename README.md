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
- `tools/`: existing experimental calculators and local item-book/preset UI. They are separate from the verified reference, and their calculations remain unvalidated.
- `scripts/prepare.mjs`: explicit publication allowlist and redirects for old `.html` links.
- `old/` and `Python Scripts/`: historical reference; excluded from the published site.

The wiki has no save upload, decoder, encoder, private keys, raw app packages or real player saves. Those belong to a separate private processor project. Keep confidential material out of source, build artifacts and browser code.

## Publishing

The current Pages site publishes the root of `main`. This Astro version must be deployed as the **built output**, not by copying private/local source into that branch. The reviewed workflow supports manual Pages publication from `main` after changing the Pages publishing source to GitHub Actions. A code commit/build is not deployment approval. Preserve the existing URL, existing player browser storage and old `.html` entry links.

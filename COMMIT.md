# COMMIT.md — Agent guide for updating the Polloverse website

> **For AI agents.** If you were handed this file with an instruction like *"update the website"*, everything you need is here. Read it top to bottom once, work out which **task** below applies, follow its steps exactly, then run **Verify**.

The site is **https://ndivilight.github.io/polloverse/**. It is a static page, rebuilt and redeployed automatically by GitHub Actions. **You never build or upload the site yourself.** Your job is to change the right *source* (a GitHub Release or a file in this repo). The deploy happens on its own.

---

## 1. Mental model

| What the visitor sees | Where it comes from | How you change it |
| --- | --- | --- |
| "Última versión" card + download button | The newest **non-prerelease** GitHub Release that has a ROM asset | Create a Release |
| "Novedades" changelog (every version) | **All** GitHub Releases: title, body (Markdown), attached ROM | Create or edit Releases |
| "Actualiza sin perder tu partida" box | `content/actualizar.md` | Commit to `main` |
| Roadmap text | `content/roadmap.md` (+ image `site/assets/roadmap.jpg`) | Commit to `main` |
| "Cómo jugar" section | `content/como-jugar.md` | Commit to `main` |
| "Objetos" section text | `content/objetos.md` | Commit to `main` |
| English version of any section | `content/<name>.en.md` (next to the Spanish file) | Commit to `main` |
| Pokédex + shop lists | `site/data/pokedex.json`, `site/data/items.json` (generated from the game source), sprites in `site/assets/sprites/` | See **F** |
| ES/EN switch, Pokédex search, spoiler toggle | `site/app.js` | Commit to `main` |
| Layout, hero, features, footer | `site/index.html`, `site/style.css`, `site/assets/` | Commit to `main` |

**The changelog is NOT a file in the repo.** It is the list of GitHub Releases. Never create a `CHANGELOG.md` and never put patch notes into `content/`.

**ROM files never go into git.** `*.gba` and `*.sav` are git-ignored. ROMs are attached to Releases as assets.

### Deploy triggers (`.github/workflows/pages.yml`)
- push to `main` → redeploy
- release `published` / `edited` / `deleted` / `unpublished` / `released` / `prereleased` → redeploy
- manual: `gh workflow run "Deploy site" --ref main`

> ⚠️ **Uploading or replacing a release asset by itself does NOT trigger a deploy.** After `gh release upload`, always run the manual trigger.

### Repository map
```
.github/workflows/pages.yml   CI: npm ci → node scripts/build.mjs → deploy dist/ to Pages
scripts/build.mjs             Generator: fetches Releases via GitHub API, renders site/index.html placeholders
scripts/make_sprites.py       Dev tool: regenerates site/assets/sprites/ from pokeemerald-expansion (not run in CI)
site/index.html               Template. Placeholders: <!--LATEST--> <!--CHANGELOG--> <!--CONTENT:name--> <!--BUILT_AT--> <!--VERSION_COUNT--> <!--REPO-->
site/style.css                Styles (pixel sunset look matching the roadmap art)
site/assets/                  roadmap.jpg, rooster.png, sprites/<n>.png (Pokédex sprites)
content/*.md                  Editable sections. content/<name>.md fills <!--CONTENT:name-->; <name>.en.md is its English version
site/app.js                   ES/EN switch, Pokédex and items rendering
site/data/                    pokedex.json, items.json — generated from the game (never hand-edit)
COMMIT.md                     This file
README.md                     Human docs (Spanish)
dist/                         Build output. Git-ignored. Never commit.
```

---

## 2. Identify the task

Look at what you were given and pick **one or more**:

| You were given… | Task |
| --- | --- |
| A `.gba` (or `.zip`/`.bps`/`.ips`/`.ups`) **and/or** patch notes for a new build | **A. Publish a new version** |
| A corrected/replacement ROM for a version that already exists, same notes | **B. Replace a version's ROM** |
| A fix to an existing version's notes, title or date | **C. Edit a version** |
| A version that must disappear | **D. Remove a version** (ask first) |
| New roadmap, install/emulator help, save instructions, or design changes | **E. Edit site content** |
| A new game build that changed wild Pokémon, gifts or the Genesis shop | **F. Refresh the game data** |
| Nothing specific ("just update it") | Run **Verify**. If the live site already matches the latest release, report that and stop. |

If you were given patch notes **without** a ROM, or a ROM **without** notes, ask for the missing piece. Exception: a hotfix ROM with a one-line description is enough.

---

## 3. Conventions (must follow)

### Language and tone
- **The site is bilingual.** Spanish is the default (Dominican, informal: "¡Dale!", "klk") and English is the switch.
  Every section text has `content/<name>.md` (ES) and `content/<name>.en.md` (EN): change both.
  Text inside `site/index.html` comes in pairs: `<span data-l="es">…</span><span data-l="en">…</span>`.
  Release notes (the changelog) stay in Spanish only.
- Code, tags and file names stay as-is.

### Tags (`tag_name`)
`v<major>.<minor>.<patch>[-rcN][.hotfix]`, lowercase:

| Situation | Example tag |
| --- | --- |
| New release candidate | `v1.0.0-rc6` |
| Update/fix on the same RC (same ROM file name) | `v1.0.0-rc5.1`, `v1.0.0-rc5.2`, … (increment) |
| Final release | `v1.0.0` |
| Content update (roadmap "Update 2", etc.) | `v1.1.0`, `v1.2.0`, … |
| Beta / test build | `v0.x-beta` + mark as **prerelease** |

Find the latest existing tag first: `gh release list -R ndivilight/polloverse -L 5`. **Tags must be unique.** Never reuse or move a tag.

### Titles (`--title`)
Human version name shown on the site, e.g. `1.0.0 RC6`, `1.0.0 RC5 · Hotfix`, `1.0.0 RC5 · Update v0.6`, `1.0.0 — Sin trabones`.

### ROM asset file name — critical
Players keep their progress because the emulator matches `<name>.sav` to `<name>.gba`. So:
- **Keep the same ROM file name as the previous release** (currently `PolloverseDream_1.0.0_RC5.gba`), unless the person you are working for explicitly gives a new name.
- If you receive the file under a random name (e.g. a WhatsApp media ID like `3EB0….gba`), **copy it** to a temp dir with the correct name before uploading. Do not rename the original.
- If the name *does* change, the notes must tell players to rename their `.sav`.
- One ROM asset per release.

### Release body (patch notes) format
GitHub-flavored Markdown. Template:

```markdown
<!-- fecha: 2026-10-20 -->
🐓 **Resumen corto de la versión** (opcional)

### 🔧 Arreglos
- **Arreglado:** qué estaba roto y cómo se ve ahora.

### 🧭 Nuevo
- Qué se añadió.

💾 Mismo nombre de archivo: reemplaza tu `.gba` y dale a **CONTINUAR**. ¡Dale! 💪
```

Rules:
- `<!-- fecha: YYYY-MM-DD -->` on the first line sets the date shown on the site. Use the date the build was actually released (e.g. the date of the source message). Without it, the publish date is used.
- Convert WhatsApp formatting: `*bold*` → `**bold**`, `_italic_` → `*italic*`, `•` bullets → `- `.
- Lists render with ▶ bullets. `###` headings render in yellow. Don't use `#`/`##`.
- Don't invent features. Only write what the source says. If unsure, leave it out.
- No @mentions or phone numbers from chats.

### Commits (task E)
- Branch: commit directly to `main`. Small, focused commits.
- Message: imperative, English, short subject. Example: `Update roadmap with Islas del Caribe details`.
- If your environment requires an attribution trailer (e.g. `Co-Authored-By:`), add it.

---

## 4. Tasks

All commands use the `gh` CLI, authenticated as an account with **write access** to `ndivilight/polloverse` (check: `gh api repos/ndivilight/polloverse --jq .permissions.push` → `true`). Always pass `-R ndivilight/polloverse` so you don't depend on the current directory.

### A. Publish a new version
1. `gh release list -R ndivilight/polloverse -L 5`: find the latest tag and confirm the new one is unused.
2. Get the previous release's ROM file name: `gh release view <latest-tag> -R ndivilight/polloverse --json assets --jq '.assets[].name'`.
3. Stage the ROM with the correct name in a temp dir:
   ```bash
   mkdir -p /tmp/polloverse-rel && cp "<received-file>" "/tmp/polloverse-rel/PolloverseDream_1.0.0_RC5.gba"
   ```
   Sanity check: GBA ROMs are usually 16 or 32 MB (`ls -l`), and bytes 0xA0–0xAB hold the game title (`dd if=FILE bs=1 skip=160 count=12 2>/dev/null`, expect `POKEMON EMER`).
4. Write the notes to `/tmp/polloverse-rel/notes.md` using the template above.
5. Create the release (this triggers the deploy):
   ```bash
   gh release create v1.0.0-rc6 "/tmp/polloverse-rel/PolloverseDream_1.0.0_RC5.gba" \
     -R ndivilight/polloverse --title "1.0.0 RC6" --notes-file /tmp/polloverse-rel/notes.md --latest
   ```
   For a beta, use `--prerelease --latest=false` instead of `--latest`.
6. Run **Verify**.

### B. Replace a version's ROM (same version, fixed file)
Prefer **A** with a `.N` hotfix tag (e.g. `v1.0.0-rc5.3`), so players see that something changed. Only overwrite in place if explicitly asked:
```bash
gh release upload v1.0.0-rc5.2 "/tmp/polloverse-rel/PolloverseDream_1.0.0_RC5.gba" -R ndivilight/polloverse --clobber
gh workflow run "Deploy site" -R ndivilight/polloverse --ref main   # required: asset uploads don't trigger deploys
```

### C. Edit a version
```bash
gh release view v1.0.0-rc5 -R ndivilight/polloverse --json body --jq .body > /tmp/notes.md   # edit this file
gh release edit v1.0.0-rc5 -R ndivilight/polloverse --notes-file /tmp/notes.md [--title "…"]
```
The `edited` event redeploys. An edit that changes nothing does **not** fire an event.

### D. Remove a version
Destructive: download links break for everyone. **Confirm with the person you're working for before running.**
```bash
gh release delete v1.0.0-rcX -R ndivilight/polloverse --yes --cleanup-tag
```

### E. Edit site content
1. Clone or pull: `git clone https://github.com/ndivilight/polloverse.git` (or `git pull` in an existing checkout).
2. Edit `content/*.md` for text. Edit `site/*` only for layout/design. To add a new section: create `content/<name>.md` and put `<!--CONTENT:<name>-->` in `site/index.html`.
3. Optional local check (requires Node ≥ 20):
   ```bash
   npm ci && GH_TOKEN=$(gh auth token) node scripts/build.mjs   # prints "Built N release(s); latest = …"
   ```
   It writes `dist/`, which is git-ignored. Don't commit it.
4. `git add -A && git commit -m "…" && git push origin main` → deploy runs.
5. Run **Verify**.

---

### F. Refresh the game data (Pokédex, shop)
`site/data/*.json` is written by the game repo's wiki tool, so the page always matches the ROM.
Locations tied to legendaries or the postgame are tagged `"spoiler": true` and stay hidden until the visitor turns spoilers on.
```bash
# in the game repo (pokeemerald-expansion, branch polloverse)
SITE_DATA_DIR=/path/to/polloverse-site/site/data python3 polloverse/tools/make_wiki.py /tmp/wiki.html
```
Then commit `site/data/` like task E.

**Sprites** (`site/assets/sprites/<n>.png`, one per Pokédex number, 64×64 transparent) come from the same pokeemerald-expansion graphics the ROM uses: the first frame of `graphics/pokemon/<species>/anim_front.png` coloured with `normal.pal`. The `*_gba` variants are **not** used by this ROM. Regenerate them only if the Pokédex range or species graphics change:
```bash
pip install pillow
python3 scripts/make_sprites.py /path/to/pokeemerald-expansion   # fails listing any species it can't find
```

## 5. Verify (always)

```bash
# 1. Wait for the deploy that your change triggered
sleep 10
RUN=$(gh run list -R ndivilight/polloverse -L 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN" -R ndivilight/polloverse --exit-status

# 2. Confirm the live site sees it (cache may lag ~1 min)
curl -s https://ndivilight.github.io/polloverse/releases.json | python3 -c \
  "import json,sys; d=json.load(sys.stdin); print('latest:', d['latest']); [print(r['tag'], r['date'], r['rom'] and r['rom']['name']) for r in d['releases'][:3]]"
```
Done when the run concludes `success` and `latest` is the tag you expect (for task A), or the page shows your text (task E).

### If the deploy fails
- `gh run view "$RUN" -R ndivilight/polloverse --log-failed`
- `is not allowed to deploy to github-pages due to environment protection rules` → the `github-pages` environment needs deployment policies for branch `main` **and** tag `*`. Repo **Settings → Environments → github-pages**.
- `GitHub API 403/401` in the build step → transient rate limit. Re-run: `gh run rerun "$RUN" -R ndivilight/polloverse`.
- Site didn't change after a successful run → hard refresh. Pages caches for ~10 min.

---

## 6. Don'ts
- ❌ Don't commit ROMs, saves or `dist/`.
- ❌ Don't hand-edit the changelog into HTML or Markdown files. Releases are the changelog.
- ❌ Don't change the ROM file name without being told to.
- ❌ Don't hand-edit `site/data/*.json`: regenerate them (task F).
- ❌ Don't reuse, move or delete tags, or delete releases, without explicit confirmation.
- ❌ Don't modify `.github/workflows/pages.yml` or `scripts/build.mjs` for a content update.
- ❌ Don't push to any branch other than `main`, and don't force-push.

## 7. Report back
Tell the person: what you published or changed (tag, title, file name), the live URL `https://ndivilight.github.io/polloverse/`, the direct download link (`https://github.com/ndivilight/polloverse/releases/download/<tag>/<file>`), and the Verify result.

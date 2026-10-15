// Builds the static site into dist/.
//
// Sources:
//   - GitHub Releases of this repo  -> changelog + ROM downloads
//   - content/*.md                  -> editable page sections
//   - site/                         -> template, styles and assets
//
// Usage: node scripts/build.mjs   (GITHUB_TOKEN and GITHUB_REPOSITORY are optional locally)

import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

const ROOT = new URL('..', import.meta.url).pathname;
const SITE = join(ROOT, 'site');
const CONTENT = join(ROOT, 'content');
const DIST = join(ROOT, 'dist');
const REPO = process.env.GITHUB_REPOSITORY || 'ndivilight/polloverse';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';

// Optional line in a release body to set its date: <!-- fecha: 2026-10-12 -->
const DATE_RE = /<!--\s*fecha:\s*(\d{4}-\d{2}-\d{2})\s*-->/i;
const ROM_RE = /\.(gba|zip|7z|bps|ips|ups)$/i;
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function formatDate(iso) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function formatSize(bytes) {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(0)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

async function fetchReleases() {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'polloverse-site' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const out = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100&page=${page}`, { headers });
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    out.push(...batch);
    if (batch.length < 100) return out;
  }
}

function normalize(r) {
  const body = r.body || '';
  const date = body.match(DATE_RE)?.[1] || r.published_at || r.created_at;
  const rom = r.assets.find((a) => ROM_RE.test(a.name)) || r.assets[0] || null;
  return {
    tag: r.tag_name,
    name: r.name || r.tag_name,
    date: date.slice(0, 10),
    sortKey: `${date.slice(0, 10)}|${r.published_at || r.created_at}`,
    prerelease: r.prerelease,
    url: r.html_url,
    notesHtml: marked.parse(body.replace(DATE_RE, '').trim() || '_Sin notas._'),
    rom: rom && {
      name: rom.name,
      size: rom.size,
      url: rom.browser_download_url,
      sha256: rom.digest?.startsWith('sha256:') ? rom.digest.slice(7) : null,
      downloads: rom.download_count,
    },
  };
}

function renderLatest(rel) {
  if (!rel) {
    return `<div class="latest-card textbox"><p class="muted">Todavía no hay versiones publicadas.</p></div>`;
  }
  const rom = rel.rom;
  return `<div class="latest-card textbox">
  <div class="latest-head">
    <span class="badge badge-new">Última versión</span>
    <span class="muted">${esc(formatDate(rel.date))}</span>
  </div>
  <h2 class="latest-name">${esc(rel.name)}</h2>
  ${rom ? `<a class="btn btn-primary btn-lg" href="${esc(rom.url)}" download>
    <span aria-hidden="true">⬇</span> Descargar ROM
  </a>
  <p class="file-meta"><code>${esc(rom.name)}</code> · ${esc(formatSize(rom.size))}</p>
  ${rom.sha256 ? `<p class="hash" title="SHA-256">SHA-256 <code>${esc(rom.sha256)}</code></p>` : ''}` : `<p class="muted">Esta versión no tiene ROM adjunta.</p>`}
  <a class="link" href="#v-${esc(rel.tag)}">Ver qué cambió →</a>
</div>`;
}

function renderChangelog(releases, latestTag) {
  if (!releases.length) return '<p class="muted">Aún no hay versiones.</p>';
  return releases
    .map((r) => `<article class="release" id="v-${esc(r.tag)}">
  <div class="release-rail" aria-hidden="true"><span class="dot${r.tag === latestTag ? ' dot-live' : ''}"></span></div>
  <div class="release-body pixel-frame">
    <header class="release-head">
      <h3><a href="#v-${esc(r.tag)}">${esc(r.name)}</a></h3>
      <div class="release-meta">
        <time datetime="${esc(r.date)}">${esc(formatDate(r.date))}</time>
        <span class="chip">${esc(r.tag)}</span>
        ${r.tag === latestTag ? '<span class="badge badge-new">Última</span>' : ''}
        ${r.prerelease ? '<span class="badge badge-beta">Beta</span>' : ''}
      </div>
    </header>
    <div class="notes">${r.notesHtml}</div>
    <footer class="release-foot">
      ${r.rom ? `<a class="btn btn-ghost" href="${esc(r.rom.url)}" download>⬇ ${esc(r.rom.name)} <span class="muted">(${esc(formatSize(r.rom.size))})</span></a>` : ''}
      <a class="link small" href="${esc(r.url)}">Ver en GitHub</a>
    </footer>
  </div>
</article>`)
    .join('\n');
}

async function renderContent(html) {
  const files = existsSync(CONTENT) ? await readdir(CONTENT) : [];
  for (const f of files.filter((f) => f.endsWith('.md'))) {
    const key = f.replace(/\.md$/, '');
    const md = await readFile(join(CONTENT, f), 'utf8');
    html = html.replaceAll(`<!--CONTENT:${key}-->`, marked.parse(md));
  }
  return html.replace(/<!--CONTENT:[\w-]+-->/g, '');
}

async function main() {
  const releases = (await fetchReleases())
    .filter((r) => !r.draft)
    .map(normalize)
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const latest = releases.find((r) => !r.prerelease && r.rom) || releases[0] || null;
  const builtAt = new Date().toISOString();

  let html = await readFile(join(SITE, 'index.html'), 'utf8');
  html = html
    .replace('<!--LATEST-->', renderLatest(latest))
    .replace('<!--CHANGELOG-->', renderChangelog(releases, latest?.tag))
    .replaceAll('<!--REPO-->', esc(REPO))
    .replace('<!--BUILT_AT-->', `<time datetime="${builtAt}">${esc(formatDate(builtAt))}</time>`)
    .replace('<!--VERSION_COUNT-->', String(releases.length));
  html = await renderContent(html);

  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });
  await cp(SITE, DIST, { recursive: true });
  await writeFile(join(DIST, 'index.html'), html);
  await writeFile(
    join(DIST, 'releases.json'),
    JSON.stringify({ repo: REPO, builtAt, latest: latest?.tag ?? null, releases: releases.map(({ notesHtml, sortKey, ...r }) => r) }, null, 2),
  );
  console.log(`Built ${releases.length} release(s); latest = ${latest?.tag ?? 'none'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

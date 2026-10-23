// Writes the WhatsApp channel post for a release to out/whatsapp/message.json.
// The workflow uploads it as an artifact; a relay next to the WhatsApp bridge
// picks it up and posts it to the Corral Studios channel.
//
// The post body is the release's <!-- whatsapp ... --> block when it has one
// (already in WhatsApp format, used as-is), else its Spanish notes converted.
// Header and links are always added. Format rules: WHATSAPP.md.
//
// Usage:
//   node scripts/whatsapp-message.mjs <tag>     announce that release
//   node scripts/whatsapp-message.mjs --mock    a made-up release, for testing the pipeline
//   node scripts/whatsapp-message.mjs --file notes.md   preview the post for notes not yet published

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const REPO = process.env.GITHUB_REPOSITORY || 'ndivilight/polloverse';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const SITE = 'https://ndivilight.github.io/polloverse/';
const OUT = new URL('../out/whatsapp/', import.meta.url).pathname;

const MOCK = {
  tag_name: 'v9.9.9-prueba',
  name: '9.9.9 · Prueba del canal',
  html_url: `https://github.com/${REPO}/releases`,
  body: `🧪 **9.9.9 — Prueba del canal**

### 📣 Canal de WhatsApp
- Cada versión nueva se anuncia aquí **automáticamente** al publicarse en GitHub.
- El mensaje trae **todos los cambios** de la versión y el enlace de descarga.

### 🛠️ Cambios (de mentira)
- Los gallos ahora cantan **dos veces** al amanecer.
- El Centro Pokémon regala un **cafecito** a quien llegue con todo el equipo debilitado.
- Ajustes de balance en la **Liga de los Gallos**.

💾 **Tu partida sigue:** mismo nombre de archivo.

<!-- en -->
English notes are not posted.`,
};

// Optional hand-written post inside the release body; invisible on GitHub and the site.
export const WHATSAPP_RE = /<!--\s*whatsapp\s*\n([\s\S]*?)-->/i;

// GitHub Markdown -> WhatsApp formatting. Only the Spanish half is posted.
export function toWhatsApp(md) {
  return md
    .split(/<!--\s*en\s*-->/i)[0]
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line
      .replace(/^#{1,6}\s+(.*)$/, '*$1*')
      .replace(/^(\s*)[-*]\s+/, '$1• ')
      .replace(/\*\*(.+?)\*\*/g, '*$1*')
      .replace(/__(.+?)__/g, '_$1_')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchRelease(tag) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'polloverse-site' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${encodeURIComponent(tag)}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

const arg = process.argv[2];
if (!arg) throw new Error('usage: whatsapp-message.mjs <tag> | --mock | --file <notes.md>');
const mock = arg === '--mock';
const rel = mock ? MOCK
  : arg === '--file' ? { tag_name: 'preview', body: await readFile(process.argv[3], 'utf8'), html_url: `https://github.com/${REPO}/releases` }
  : await fetchRelease(arg);

const text = [
  mock ? '⚠️ *MENSAJE DE PRUEBA*: ignoren esto, estamos probando los anuncios automáticos.\n' : '',
  `🐓 *¡Nueva versión de POKÉMON: THE POLLOVERSE DREAM!* 🔥`,
  '',
  (rel.body || '').match(WHATSAPP_RE)?.[1].trim() || toWhatsApp(rel.body || rel.name || rel.tag_name),
  '',
  `⬇️ Descárgala aquí: ${SITE}`,
  `📝 Notas completas: ${rel.html_url}`,
].join('\n').trim();

await mkdir(OUT, { recursive: true });
await writeFile(OUT + 'message.json', JSON.stringify({ tag: rel.tag_name, mock, text }, null, 2));
console.log(text);

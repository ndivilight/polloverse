# WHATSAPP.md — How release posts for the WhatsApp channel are written

> **For AI agents.** Read this when you publish or edit a release (COMMIT.md tasks A–C), or when someone asks you to write or fix a post for the WhatsApp channel. It explains what gets posted, the formatting WhatsApp understands, and how to write and preview a hand-made post.

The channel is **Corral Studios**: https://whatsapp.com/channel/0029Vb8L8o82ER6ktNYvy327

---

## 1. How a post gets to the channel

```
gh release create …  ──▶  release "published"  ──▶  .github/workflows/whatsapp.yml
                                                       builds the post (scripts/whatsapp-message.mjs)
                                                       and uploads it as the "whatsapp-message" artifact
                                                                │
                          relay next to the WhatsApp bridge  ◀──┘  (polls every ~60 s)
                          posts the text to Corral Studios
```

- **Publishing a release posts automatically, and only once.** Pre-releases count as published too. Editing a release (`gh release edit`) does **not** post again.
- There is no undo. Once the post is out, only a channel admin can delete it, from their phone.
- The post is in **Spanish only**. The English notes after `<!-- en -->` are never posted.

## 2. What a post looks like

Every post has the same frame. The script adds the header and the links on its own. **You only write the middle.**

```
🐓 *¡Nueva versión de POKÉMON: THE POLLOVERSE DREAM!* 🔥      ← added automatically

🛠️ *1.2.3 — Nombre de la versión*                             ┐
                                                              │
*🔧 Arreglos*                                                 │  the middle:
• *Arreglado:* qué estaba roto y cómo se ve ahora.            │  your whatsapp block,
                                                              │  or the Spanish notes
*🧭 Nuevo*                                                    │  converted automatically
• Qué se añadió.                                              │
                                                              │
💾 *Tu partida sigue:* mismo nombre de archivo.                ┘

⬇️ Descárgala aquí: https://ndivilight.github.io/polloverse/   ← added automatically
📝 Notas completas: https://github.com/ndivilight/polloverse/releases/tag/<tag>
```

## 3. Where the middle comes from

**Option 1, the default:** the Spanish half of the release notes (everything before `<!-- en -->`), converted automatically:

| Release notes (GitHub Markdown) | Posted on WhatsApp |
| --- | --- |
| `### 🔧 Arreglos` (any heading) | `*🔧 Arreglos*` |
| `**negrita**` | `*negrita*` |
| `__cursiva__` | `_cursiva_` |
| `- punto` or `* punto` | `• punto` |
| `[texto](https://…)` | `texto (https://…)` |
| `<!-- comentarios -->` | removed |
| `` `PolloverseDream.gba` `` | unchanged (monospace on WhatsApp too) |

Notes written with the COMMIT.md template convert cleanly, so most releases need nothing more.

**Option 2, a hand-written post:** add a `whatsapp` block to the release body. When it's there, it is posted **exactly as written** in place of the converted notes. It's invisible on GitHub and on the site. Use it when:
- the notes are long (more than about 15 bullet points, or a "🧪 Probado" section the players don't care about);
- the post should sound different from the changelog (hype, a DLC teaser, a call to action);
- the conversion comes out wrong (nested lists, tables, images).

```markdown
<!-- fecha: 2026-10-25 -->
🛠️ **1.2.3 — Nombre de la versión**

### 🔧 Arreglos
- …the full notes for the site…

<!-- whatsapp
🛠️ *1.2.3 — Nombre de la versión*

*🔧 Arreglos*
• Lo más importante, en una línea.
• Lo segundo más importante.

💾 *Tu partida sigue:* reemplaza tu `.gba` y dale a *CONTINUAR*. ¡Dale! 💪
-->

<!-- title-en: 1.2.3 · English title -->
<!-- en -->
…English notes…
```

Rules for the block:
- `<!-- whatsapp` goes **alone on its line**, and the text starts on the next line. The block ends at the first `-->`, so never write `-->` inside it.
- Put it **before** `<!-- en -->`.
- Write the middle only: no header and no download links, because those are added automatically.
- It must already be in WhatsApp format (section 4). Nothing in it is converted.

## 4. WhatsApp formatting (only for the whatsapp block)

| You want | Write | Don't write |
| --- | --- | --- |
| Bold | `*texto*` | `**texto**` |
| Italic | `_texto_` | `*texto*` |
| Strikethrough | `~texto~` | `~~texto~~` |
| Monospace | `` `texto` `` or ```` ```texto``` ```` | |
| Bullets | `• punto` (or `- punto`) | nested lists |
| Numbered list | `1. paso` | |
| Quote | `> texto` | |
| Section title | `*🔧 Título*` on its own line | `### Título`, since WhatsApp has no headings |
| Link | the bare URL: `https://…` | `[texto](url)` |

- The markers have to touch the text: `*bold*` works, `* bold *` doesn't.
- No tables, no HTML, no images. A blank line separates sections.
- Emojis are welcome. Start each section title with one, matching the changelog: 🔧 arreglos, 🧭 nuevo, 🐓 Liga/DLC, 💾 partida, 🚲/🗺️ lugares, ⚠️ avisos.

## 5. Content rules (both options)

- **Spanish, Dominican and informal**, like the rest of the project: "¡Dale!", "klk", "mi gente". Address the players as *tú*.
- **Keep it short.** A post should fit on about one phone screen (roughly 1,500 characters for the middle). Anything longer goes in the release notes; the "Notas completas" link is right there.
- **Lead with what the player feels:** new content first, then fixes, then balance. Leave out internal testing ("🧪 Probado"), build details and credits lists, which stay on the site.
- **Always say whether saves carry over.** If the ROM file name changed, say that the `.sav` has to be renamed.
- **No spoilers** beyond what the release notes already say: postgame bosses, legendary locations and who the final figure is.
- **No @mentions, phone numbers, names of people from the group chats, or private links.**
- **Don't make anything up.** Only write what the notes or the source message say.

## 6. Preview before publishing

Always look at the exact post before running `gh release create`:

```bash
node scripts/whatsapp-message.mjs --file /tmp/polloverse-rel/notes.md
```

It prints the full post (header + middle + links). The "Notas completas" link in a preview points to the releases list; the real post links to the tag. To preview a release that's already published: `node scripts/whatsapp-message.mjs v1.2.2`.

## 7. Posting by hand

These post to a **public channel** with real followers. Run them only when the person you work for asks.

```bash
# Re-announce a release (e.g. the automatic post failed or was deleted)
gh workflow run whatsapp.yml -R ndivilight/polloverse --ref main -f tag=v1.2.3

# Test the pipeline: posts a clearly labeled MOCK message (delete it from the phone afterwards)
gh workflow run whatsapp.yml -R ndivilight/polloverse --ref main
```

Check that it went out: the "WhatsApp announcement" run must end in `success` (`gh run list -R ndivilight/polloverse -w whatsapp.yml -L 1`). The post shows up in the channel within about a minute. If the run succeeded but nothing was posted, the relay or the WhatsApp bridge is down. That runs on divilight's server, so tell the person you work for and don't retry in a loop.

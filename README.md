# 🐓 Pokémon: The Polloverse Dream

Rom hack de Pokémon Emerald por **Los Gallos Sin Planes** (Cake & Others).
Hoenn + Kanto, 16 gimnasios, Gen 1–4, Modo Gallinero.

**🌐 Sitio:** https://ndivilight.github.io/polloverse/
**⬇ Última versión:** [Releases](https://github.com/ndivilight/polloverse/releases/latest)

---

## Cómo funciona

El sitio se reconstruye y publica solo (GitHub Actions → GitHub Pages) cada vez que:

- se hace **push** a `main` (cualquier cambio en el repo), o
- se **publica, edita o borra un Release**.

| Qué | Dónde vive |
| --- | --- |
| ROMs y notas de cada versión (changelog) | [GitHub Releases](https://github.com/ndivilight/polloverse/releases) |
| Textos de la página (actualizar, roadmap, cómo jugar) | `content/*.md` |
| Diseño de la página | `site/index.html`, `site/style.css`, `site/assets/` |
| Generador | `scripts/build.mjs` |
| Deploy automático | `.github/workflows/pages.yml` |
| Aviso en el canal de WhatsApp | `.github/workflows/whatsapp.yml`, `scripts/whatsapp-message.mjs`, formato en [`WHATSAPP.md`](WHATSAPP.md) |

Las ROMs van como archivos adjuntos de los Releases (no dentro del código), así el repo se mantiene liviano.

## Publicar una versión nueva

### Desde la web
1. Ve a **Releases → Draft a new release**.
2. **Tag:** crea uno nuevo, por ejemplo `v1.0.0-rc6`.
3. **Título:** el nombre que se verá en la página, por ejemplo `1.0.0 RC6`.
4. **Descripción:** las patch notes en Markdown.
5. Arrastra el `.gba` a la caja de archivos adjuntos. **Usa el mismo nombre de archivo que la versión anterior** para que las partidas sigan funcionando.
6. Dale a **Publish release**. En 1–2 minutos el sitio muestra la nueva versión como la última, y el canal de WhatsApp **Corral Studios** recibe el aviso con los cambios.

### Desde la terminal
```bash
gh release create v1.0.0-rc6 PolloverseDream_1.0.0_RC5.gba \
  --title "1.0.0 RC6" --notes-file notas.md
```

### Detalles
- **Fecha:** el sitio usa la fecha de publicación. Para otra fecha, pon `<!-- fecha: 2026-10-20 -->` en la descripción.
- **Betas:** marca *Set as a pre-release* y saldrá con la etiqueta *Beta*. No cuenta como "última versión".
- **Corregir notas:** edita el Release y el sitio se actualiza solo. El aviso de WhatsApp **no** se vuelve a mandar.
- **Aviso de WhatsApp:** se arma solo con las notas en español. Para escribirlo a mano, pon un bloque `<!-- whatsapp … -->` en la descripción. Mira [`WHATSAPP.md`](WHATSAPP.md). Para ver cómo va a quedar antes de publicar: `node scripts/whatsapp-message.mjs --file notas.md`.

## Actualizar con un agente de IA (Claude, ChatGPT, etc.)

[`COMMIT.md`](COMMIT.md) es una guía escrita para agentes de IA. Explica la estructura del repo, dónde va cada cosa, cómo nombrar versiones y archivos, y cómo verificar que el sitio se actualizó.

Para usarla:

1. Abre un agente que tenga acceso a una terminal con [`gh`](https://cli.github.com/) autenticado con una cuenta que pueda escribir en este repo (por ejemplo Claude Code).
2. Pásale `COMMIT.md` junto con lo nuevo: el `.gba` y/o las patch notes (tal cual las escribiste en el grupo).
3. Dile: **"actualiza el sitio"** / **"update the website"**.

Ejemplos:

> Lee COMMIT.md. Aquí está la nueva ROM `~/Descargas/PolloverseDream_1.0.0_RC5.gba` con estas notas: "🐓 Arreglado el crash en Mt. Pyre…". Actualiza el sitio.

> Lee COMMIT.md y actualiza el roadmap: Update 2 sale en diciembre.

> Lee COMMIT.md y actualiza el sitio. *(si no le das nada, solo verifica que el sitio esté al día)*

El agente crea el Release (o el commit), espera el deploy y te devuelve el link de descarga.

## Probar el sitio en tu PC

```bash
npm install
npm run preview   # genera dist/ y lo sirve en http://localhost:3000
```

---

Proyecto de fans sin fines de lucro. No está afiliado a Nintendo, Game Freak ni The Pokémon Company.

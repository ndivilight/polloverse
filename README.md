# 🐓 Pokémon: The Polloverse Dream

Rom hack de Pokémon Emerald por **Freddy Santana** (Los Gallos Sin Planes · Cake & Others).
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

Las ROMs van como archivos adjuntos de los Releases (no dentro del código), así el repo se mantiene liviano.

## Publicar una versión nueva

### Desde la web
1. Ve a **Releases → Draft a new release**.
2. **Tag:** crea uno nuevo, por ejemplo `v1.0.0-rc6`.
3. **Título:** el nombre que se verá en la página, por ejemplo `1.0.0 RC6`.
4. **Descripción:** las patch notes en Markdown.
5. Arrastra el `.gba` a la caja de archivos adjuntos. **Usa el mismo nombre de archivo que la versión anterior** para que las partidas sigan funcionando.
6. Dale a **Publish release**. En 1–2 minutos el sitio muestra la nueva versión como la última.

### Desde la terminal
```bash
gh release create v1.0.0-rc6 PolloverseDream_1.0.0_RC5.gba \
  --title "1.0.0 RC6" --notes-file notas.md
```

### Detalles
- **Fecha:** el sitio usa la fecha de publicación. Para otra fecha, pon `<!-- fecha: 2026-10-20 -->` en la descripción.
- **Betas:** marca *Set as a pre-release* y saldrá con la etiqueta *Beta*. No cuenta como "última versión".
- **Corregir notas:** edita el Release y el sitio se actualiza solo.

## Probar el sitio en tu PC

```bash
npm install
npm run preview   # genera dist/ y lo sirve en http://localhost:3000
```

---

Proyecto de fans sin fines de lucro. No está afiliado a Nintendo, Game Freak ni The Pokémon Company.

// Language switch (ES/EN), Pokédex and items sections.
// Data in site/data/ is generated from the game source (polloverse/tools/make_wiki.py with SITE_DATA_DIR).
(function () {
  'use strict';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  // ---------- language ----------
  const params = new URLSearchParams(location.search);
  let lang = params.get('lang') || store.get('pv-lang') || 'es';
  if (lang !== 'en') lang = 'es';

  const T = {
    es: {
      land: 'Hierba/Cueva', water: 'Surf', fishing: 'Pesca', rock_smash: 'Rompe Rocas',
      lv: 'Nv', evolve: 'Evoluciona de', breed: 'Cría en la Guardería a partir de su evolución',
      egg: (p, inc) => `Huevo de ${p} en la Guardería` + (inc ? ` (el padre lleva ${inc})` : ''),
      hidden: '??? — activa los spoilers para verlo',
      none: 'Ningún Pokémon coincide con tu búsqueda.',
      count: (n, t) => `${n} de ${t}`,
      loadError: 'No se pudieron cargar los datos.',
    },
    en: {
      land: 'Grass/Cave', water: 'Surfing', fishing: 'Fishing', rock_smash: 'Rock Smash',
      lv: 'Lv', evolve: 'Evolve', breed: 'Breed from its evolution at the Day Care',
      egg: (p, inc) => `Egg from ${p} at the Day Care` + (inc ? ` (parent holds ${inc})` : ''),
      hidden: '??? — turn on spoilers to see it',
      none: 'No Pokémon match your search.',
      count: (n, t) => `${n} of ${t}`,
      loadError: 'Could not load the data.',
    },
  };

  function applyLang() {
    document.documentElement.dataset.lang = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-ph-es]').forEach((el) => { el.placeholder = el.dataset['ph' + (lang === 'en' ? 'En' : 'Es')]; });
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English');
  }

  // ---------- spoilers ----------
  let spoilers = store.get('pv-spoilers') === '1';

  // ---------- Pokédex ----------
  let dex = null;
  let items = null;

  function placeList(mon) {
    const t = T[lang];
    const out = [];
    for (const w of mon.wild) {
      out.push(`${esc(w.map)} <span class="region region-${esc(w.region.toLowerCase())}">${esc(w.region)}</span> · ${esc(t[w.method] || w.method)}, ${t.lv} ${w.min === w.max ? w.min : `${w.min}–${w.max}`}`);
    }
    for (const o of mon.other) {
      out.push(o.spoiler && !spoilers ? `<span class="spoiler-hidden">${esc(t.hidden)}</span>` : esc(o.text));
    }
    if (mon.baby) out.push(esc(t.egg(mon.baby.parent || '?', mon.baby.incense)));
    if (mon.evo) out.push(`${esc(t.evolve)} ${esc(mon.evo)}`);
    if (!out.length) out.push(esc(t.breed));
    return out;
  }

  function searchText(mon) {
    return [mon.name, String(mon.n), ...mon.wild.map((w) => w.map), ...mon.other.filter((o) => spoilers || !o.spoiler).map((o) => o.text), mon.evo || '']
      .join(' ').toLowerCase();
  }

  function renderDex() {
    const body = document.getElementById('dex-body');
    const count = document.getElementById('dex-count');
    if (!body || !dex) return;
    const q = (document.getElementById('dex-search')?.value || '').trim().toLowerCase();
    const region = document.getElementById('dex-region')?.value || 'all';
    const rows = [];
    let shown = 0;
    for (const mon of dex) {
      if (region !== 'all' && !mon.wild.some((w) => w.region === region)
        && !mon.other.some((o) => (spoilers || !o.spoiler) && o.text.includes(`(${region})`))) continue;
      if (q && !searchText(mon).includes(q)) continue;
      shown++;
      rows.push(`<tr><td class="dex-num">${String(mon.n).padStart(3, '0')}</td><td class="dex-name"><img class="dex-sprite" src="assets/sprites/${mon.n}.png" width="64" height="64" loading="lazy" alt="">${esc(mon.name)}</td>`
        + `<td><ul class="dex-where">${placeList(mon).map((p) => `<li>${p}</li>`).join('')}</ul></td></tr>`);
    }
    body.innerHTML = rows.join('') || `<tr><td colspan="3" class="muted">${esc(T[lang].none)}</td></tr>`;
    if (count) count.textContent = T[lang].count(shown, dex.length);
  }

  // ---------- items ----------
  function renderItems() {
    const box = document.getElementById('items-shop');
    if (!box || !items) return;
    const chips = (list) => list.map((i) => `<span class="chip item-chip">${esc(i)}</span>`).join(' ');
    const post = spoilers
      ? `<p class="item-list">${chips(items.genesisPostgame)}</p>`
      : `<p class="spoiler-hidden">${esc(T[lang].hidden)}</p>`;
    box.innerHTML = `
      <h3><span data-l="es">Mercader Genesis</span><span data-l="en">Genesis merchant</span></h3>
      <p class="muted">${esc(items.genesis.where)}</p>
      <p class="item-list">${chips(items.genesis.items)}</p>
      <h3><span data-l="es">Después del Salón de la Fama</span><span data-l="en">After the Hall of Fame</span></h3>
      ${post}`;
  }

  function renderAll() {
    applyLang();
    renderDex();
    renderItems();
    const sp = document.getElementById('spoiler-toggle');
    if (sp) sp.checked = spoilers;
  }

  async function load() {
    try {
      const [d, i] = await Promise.all([
        fetch('data/pokedex.json').then((r) => r.json()),
        fetch('data/items.json').then((r) => r.json()),
      ]);
      dex = d;
      items = i;
    } catch (e) {
      const body = document.getElementById('dex-body');
      if (body) body.innerHTML = `<tr><td colspan="3" class="muted">${esc(T[lang].loadError)}</td></tr>`;
      return;
    }
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyLang();
    document.getElementById('lang-toggle')?.addEventListener('click', () => {
      lang = lang === 'es' ? 'en' : 'es';
      store.set('pv-lang', lang);
      renderAll();
    });
    document.getElementById('spoiler-toggle')?.addEventListener('change', (e) => {
      spoilers = e.target.checked;
      store.set('pv-spoilers', spoilers ? '1' : '0');
      renderAll();
    });
    document.getElementById('dex-search')?.addEventListener('input', renderDex);
    document.getElementById('dex-region')?.addEventListener('change', renderDex);
    load();
  });
  applyLang();
})();

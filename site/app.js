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
      allPlaces: 'Todos los lugares', otherPlaces: 'Otros',
      loadError: 'No se pudieron cargar los datos.',
    },
    en: {
      land: 'Grass/Cave', water: 'Surfing', fishing: 'Fishing', rock_smash: 'Rock Smash',
      lv: 'Lv', evolve: 'Evolve', breed: 'Breed from its evolution at the Day Care',
      egg: (p, inc) => `Egg from ${p} at the Day Care` + (inc ? ` (parent holds ${inc})` : ''),
      hidden: '??? — turn on spoilers to see it',
      none: 'No Pokémon match your search.',
      count: (n, t) => `${n} of ${t}`,
      allPlaces: 'All places', otherPlaces: 'Other',
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

  // ---------- places (Pokédex "Place" filter) ----------
  // Wild map names come from the game's map ids ("Granite Cave B1f", "MT Pyre 3F"); "other" entries
  // are free text ("Devon Corp. 2F, Rustboro (HOENN) - ..."). Both are folded into one place per
  // area: floors and rooms into their dungeon, buildings into the town they're in.
  // [prefix of the normalized name, label, region when the text doesn't say]
  const PLACE_GROUPS = [
    ['abandoned ship', 'Abandoned Ship'], ['artisan cave', 'Artisan Cave'], ['cave of origin', 'Cave of Origin'],
    ['granite cave', 'Granite Cave'], ['magma hideout', 'Magma Hideout'], ['meteor falls', 'Meteor Falls'],
    ['mirage tower', 'Mirage Tower'], ['mt pyre', 'Mt. Pyre'], ['new mauville', 'New Mauville'],
    ['seafloor cavern', 'Seafloor Cavern'], ['shoal cave', 'Shoal Cave'], ['sky pillar', 'Sky Pillar'],
    ['victory road', 'Victory Road'], ['safari zone', 'Safari Zone'], ['cerulean cave', 'Cerulean Cave'],
    ['digletts cave', "Diglett's Cave"], ['mt ember', 'Mt. Ember'], ['mt moon', 'Mt. Moon'],
    ['pokemon mansion', 'Pokémon Mansion'], ['pokemon tower', 'Pokémon Tower'], ['rock tunnel', 'Rock Tunnel'],
    ['seafoam islands', 'Seafoam Islands'], ['power plant', 'Power Plant'], ['ssanne', 'S.S. Anne'],
    ['five island lost cave', 'Five Island Lost Cave'], ['four island icefall cave', 'Four Island Icefall Cave'],
    ['seven island sevault canyon', 'Seven Island Sevault Canyon'], ['seven island tanoby ruins', 'Seven Island Tanoby Ruins'],
    ['route 21', 'Route 21'], ['underwater route 124', 'Route 124'], ['underwater route 126', 'Route 126'],
    ['weather institute', 'Route 119'],
    ['prof oak s lab', 'Pallet Town', 'KANTO'], ['pewter museum', 'Pewter City', 'KANTO'],
    ['celadon condominiums', 'Celadon City'], ['silph co', 'Saffron City'], ['cinnabar lab', 'Cinnabar Island'],
    ['devon corp', 'Rustboro City'], ['steven s house', 'Mossdeep City'],
  ];
  const normPlace = (s) => s.toLowerCase().replace(/é/g, 'e').replace(/[^a-z0-9]+/g, ' ').trim();

  function placeOf(name, region) {
    const n = normPlace(name);
    const g = PLACE_GROUPS.find(([pre]) => n === pre || n.startsWith(pre + ' '));
    const label = g ? g[1] : name.replace(/\bPokemon\b/g, 'Pokémon');
    region = region || (g && g[2]) || '';
    return { key: `${region}|${normPlace(label)}`, label, region };
  }

  // "Route 12, sleeping SNORLAX (KANTO) - Poke Flute" -> place "Route 12" in KANTO
  function otherPlace(text) {
    const region = (text.match(/\((HOENN|KANTO)\)/) || [])[1];
    return placeOf(text.split(/ - | \(|, /)[0], region);
  }

  // Every place a Pokémon can be found, tagged by the entry it came from (spoilers respected).
  function monPlaces(mon) {
    return [
      ...mon.wild.map((w) => placeOf(w.map, w.region)),
      ...mon.other.filter((o) => spoilers || !o.spoiler).map((o) => otherPlace(o.text)),
    ];
  }

  function buildPlaces() {
    const sel = document.getElementById('dex-place');
    if (!sel || !dex) return;
    const region = document.getElementById('dex-region')?.value || 'all';
    const places = new Map();
    for (const mon of dex) {
      for (const p of monPlaces(mon)) {
        if (region !== 'all' && p.region !== region) continue;
        const e = places.get(p.key) || places.set(p.key, { ...p, mons: new Set() }).get(p.key);
        e.mons.add(mon.n);
      }
    }
    const t = T[lang];
    const groups = [['HOENN', 'Hoenn'], ['KANTO', 'Kanto'], ['', t.otherPlaces]];
    const byName = (a, b) => a.label.localeCompare(b.label, 'en', { numeric: true });
    const prev = sel.value;
    sel.innerHTML = `<option value="">${esc(t.allPlaces)}</option>` + groups.map(([r, name]) => {
      const list = [...places.values()].filter((p) => p.region === r).sort(byName);
      return list.length ? `<optgroup label="${esc(name)}">${list.map((p) => `<option value="${esc(p.key)}">${esc(p.label)} (${p.mons.size})</option>`).join('')}</optgroup>` : '';
    }).join('');
    sel.value = places.has(prev) ? prev : '';
  }

  // ---------- Pokédex ----------
  let dex = null;
  let items = null;

  // Lines for the "Where" column; `here` marks the ones in the selected place.
  function placeList(mon, place) {
    const t = T[lang];
    const out = [];
    for (const w of mon.wild) {
      out.push({
        html: `${esc(w.map)} <span class="region region-${esc(w.region.toLowerCase())}">${esc(w.region)}</span> · ${esc(t[w.method] || w.method)}, ${t.lv} ${w.min === w.max ? w.min : `${w.min}–${w.max}`}`,
        here: place && placeOf(w.map, w.region).key === place,
      });
    }
    for (const o of mon.other) {
      const hidden = o.spoiler && !spoilers;
      out.push({
        html: hidden ? `<span class="spoiler-hidden">${esc(t.hidden)}</span>` : esc(o.text),
        here: !hidden && place && otherPlace(o.text).key === place,
      });
    }
    if (mon.baby) out.push({ html: esc(t.egg(mon.baby.parent || '?', mon.baby.incense)) });
    if (mon.evo) out.push({ html: `${esc(t.evolve)} ${esc(mon.evo)}` });
    if (!out.length) out.push({ html: esc(t.breed) });
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
    const place = document.getElementById('dex-place')?.value || '';
    const rows = [];
    let shown = 0;
    for (const mon of dex) {
      const places = monPlaces(mon);
      if (region !== 'all' && !places.some((p) => p.region === region)) continue;
      if (place && !places.some((p) => p.key === place)) continue;
      if (q && !searchText(mon).includes(q)) continue;
      shown++;
      rows.push(`<tr><td class="dex-num">${String(mon.n).padStart(3, '0')}</td><td class="dex-name"><img class="dex-sprite" src="assets/sprites/${mon.n}.png" width="64" height="64" loading="lazy" alt="">${esc(mon.name)}</td>`
        + `<td><ul class="dex-where">${placeList(mon, place).sort((a, b) => !!b.here - !!a.here).map((p) => `<li${p.here ? ' class="is-here"' : ''}>${p.html}</li>`).join('')}</ul></td></tr>`);
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
    buildPlaces();
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

  // ---------- changelog: "Ver más" on long release notes ----------
  const NOTES_MAX = 260; // px; notes taller than this start collapsed

  function setNotes(btn, open) {
    const notes = document.getElementById(btn.getAttribute('aria-controls'));
    if (!notes) return;
    notes.classList.toggle('is-collapsed', !open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id.startsWith('v-')) return;
    const btn = document.querySelector(`.notes-toggle[aria-controls="${CSS.escape('notes-' + id.slice(2))}"]`);
    if (btn && !btn.hidden) setNotes(btn, true);
  }

  function initNotes() {
    document.querySelectorAll('.notes-toggle').forEach((btn) => {
      const notes = document.getElementById(btn.getAttribute('aria-controls'));
      if (!notes || notes.scrollHeight <= NOTES_MAX) return;
      btn.hidden = false;
      setNotes(btn, false);
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        setNotes(btn, open);
        if (!open) btn.closest('.release')?.scrollIntoView({ block: 'nearest' });
      });
    });
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyLang();
    initNotes();
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
    document.getElementById('dex-region')?.addEventListener('change', () => { buildPlaces(); renderDex(); });
    document.getElementById('dex-place')?.addEventListener('change', renderDex);
    load();
  });
  applyLang();
})();

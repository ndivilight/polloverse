#!/usr/bin/env python3
"""Generate site/assets/sprites/<n>.png (64x64, transparent) for every Pokédex entry.

Sprites come from the pokeemerald-expansion graphics the ROM is built with:
the first frame of graphics/pokemon/<species>/anim_front.png (or front.png),
coloured with normal.pal, palette index 0 transparent.

Usage (needs Pillow):
  python3 scripts/make_sprites.py /path/to/pokeemerald-expansion
"""
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEX = ROOT / 'site' / 'data' / 'pokedex.json'
OUT = ROOT / 'site' / 'assets' / 'sprites'

def folder_name(name: str) -> str:
    s = name.lower().replace('♀', '_f').replace('♂', '_m')
    s = re.sub(r"[.'’:]", '', s)
    s = re.sub(r'[\s-]+', '_', s)
    return s


def find_dir(base: Path, name: str) -> Path | None:
    key = folder_name(name)
    d = base / key  # default form lives at the top level; alternate forms are subfolders
    return d if (d / 'anim_front.png').exists() or (d / 'front.png').exists() else None


def read_jasc(path: Path) -> list[tuple[int, int, int]]:
    lines = path.read_text().split('\n')
    n = int(lines[2])
    return [tuple(int(v) for v in lines[3 + i].split()[:3]) for i in range(n)]


def render(d: Path) -> Image.Image:
    src = Image.open(d / 'anim_front.png' if (d / 'anim_front.png').exists() else d / 'front.png')
    frame = src.crop((0, 0, 64, 64))
    colors = read_jasc(d / 'normal.pal')
    idx = frame if frame.mode == 'P' else frame.convert('P')
    out = Image.new('RGBA', (64, 64))
    px_in, px_out = idx.load(), out.load()
    for y in range(64):
        for x in range(64):
            i = px_in[x, y]
            if i:
                r, g, b = colors[i]
                px_out[x, y] = (r, g, b, 255)
    return out


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    base = Path(sys.argv[1]) / 'graphics' / 'pokemon'
    OUT.mkdir(parents=True, exist_ok=True)
    missing = []
    for mon in json.loads(DEX.read_text()):
        d = find_dir(base, mon['name'])
        if not d:
            missing.append(mon['name'])
            continue
        render(d).save(OUT / f"{mon['n']}.png", optimize=True)
    print(f'wrote {len(list(OUT.glob("*.png")))} sprites to {OUT.relative_to(ROOT)}')
    if missing:
        sys.exit(f'missing: {", ".join(missing)}')


if __name__ == '__main__':
    main()

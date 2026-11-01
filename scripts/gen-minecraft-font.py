#!/usr/bin/env python3
"""Собирает веб-шрифт Minecraft Ten из ресурспака xllifi/MinecraftTen.

    python3 scripts/gen-minecraft-font.py client.jar путь/к/MinecraftTen/assets/minecraft/textures/font

Настоящий Minecraft Ten закрытый и без кириллицы, поэтому берём пак
(CC BY 4.0, https://github.com/xllifi/MinecraftTen) с глифами в его стиле.
Из клиента игры читается только раскладка символов на текстурах:
assets/minecraft/font/include/default.json.

Каждый пиксель текстуры становится квадратом контура. В шрифте 8 пикселей
на кегль, поэтому чётко он выглядит при размерах, кратных 8 (16, 24, 32).
"""
import json
import os
import sys
import zipfile

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from PIL import Image

OUT = 'src/assets/fonts/minecraft-ten.woff2'
PX = 100     # единиц шрифта на пиксель
UPM = 8 * PX
WANTED = (range(0x20, 0x7F), range(0xA0, 0x100), range(0x400, 0x460),
          (0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026,
           0x2116, 0x20BD, 0x2190, 0x2192, 0x2212))
wanted = {c for r in WANTED for c in r}

jar = zipfile.ZipFile(sys.argv[1])
pack = sys.argv[2]
providers = json.loads(jar.read('assets/minecraft/font/include/default.json'))['providers']

glyphs = {}
for p in providers:
    if p.get('type') != 'bitmap':
        continue
    ns, path = p['file'].split(':') if ':' in p['file'] else ('minecraft', p['file'])
    local = os.path.join(pack, os.path.basename(path))
    if not os.path.exists(local):
        continue
    img = Image.open(local).convert('RGBA')
    rows = p['chars']
    cw, ch = img.width // len(rows[0]), img.height // len(rows)
    scale = cw // 8 or 1                    # текстуры могут быть больше 8×8
    if ch != cw:
        continue                            # высокие наборы (азия) не нужны
    ascent = p.get('ascent', 7)
    for ry, row in enumerate(rows):
        for rx, c in enumerate(row):
            cp = ord(c)
            if cp not in wanted or cp in glyphs or c == ' ':
                continue
            cell = img.crop((rx * cw, ry * ch, rx * cw + cw, ry * ch + ch))
            on = [[cell.getpixel((x, y))[3] > 127 for x in range(0, cw, scale)] for y in range(0, ch, scale)]
            right = max((x for r in on for x, v in enumerate(r) if v), default=-1)
            if right < 0:
                continue
            glyphs[cp] = (on, right + 1, ascent)

# Ё и ё в паке лежат в высокой текстуре accented.png, её не читаем:
# дорисовываем точки над Е и е.
for base, cp in ((0x415, 0x401), (0x435, 0x451)):
    on, width, ascent = glyphs[base]
    top = next(y for y, r in enumerate(on) if any(r))
    dots = [x in (1, width - 2) for x in range(len(on[0]))]
    if top >= 2:
        fixed = [list(r) for r in on]
        fixed[top - 2] = dots
        glyphs[cp] = (fixed, width, ascent)
    else:
        glyphs[cp] = ([dots, [False] * len(dots)] + on, width, ascent + 2)

names = {cp: f'uni{cp:04X}' for cp in glyphs}
order = ['.notdef', 'space'] + [names[c] for c in sorted(glyphs)]
fb = FontBuilder(UPM, isTTF=True)
fb.setupGlyphOrder(order)
cmap = {names[c]: c for c in glyphs}
fb.setupCharacterMap({0x20: 'space', 0xA0: 'space', **{c: names[c] for c in glyphs if c != 0xA0}})

drawn, metrics = {}, {}
empty = TTGlyphPen(None)
drawn['.notdef'] = empty.glyph()
drawn['space'] = TTGlyphPen(None).glyph()
metrics['.notdef'] = (5 * PX, 0)
metrics['space'] = (4 * PX, 0)
for cp, (on, width, ascent) in glyphs.items():
    pen = TTGlyphPen(None)
    for y, row in enumerate(on):
        x = 0
        while x < len(row):
            if not row[x]:
                x += 1
                continue
            end = x
            while end < len(row) and row[end]:
                end += 1
            top, bottom = (ascent - y) * PX, (ascent - y - 1) * PX
            pen.moveTo((x * PX, bottom))
            pen.lineTo((x * PX, top))
            pen.lineTo((end * PX, top))
            pen.lineTo((end * PX, bottom))
            pen.closePath()
            x = end
    drawn[names[cp]] = pen.glyph()
    metrics[names[cp]] = ((width + 1) * PX, 0)

fb.setupGlyf(drawn)
fb.setupHorizontalMetrics(metrics)
fb.setupHorizontalHeader(ascent=8 * PX, descent=-2 * PX)
fb.setupNameTable({'familyName': 'Minecraft Ten', 'styleName': 'Regular'})
fb.setupOS2(sTypoAscender=8 * PX, sTypoDescender=-2 * PX, usWinAscent=8 * PX, usWinDescent=2 * PX)
fb.setupPost()
fb.font.flavor = 'woff2'
fb.font.save(OUT)
print(len(glyphs), 'глифов; нет:', ''.join(chr(c) for c in sorted(wanted) if c not in glyphs and c not in (0x20, 0xA0, 0xAD) and chr(c).isprintable())[:60])

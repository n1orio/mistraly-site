#!/usr/bin/env python3
"""Значки вики 8×8: чатовые иконки из мода плюс дорисованные в том же стиле.

    python3 scripts/gen-wiki-icons.py /home/nio/mistraly-season-2/mistraly

Монетка как у чатовых иконок: срезанные углы, тёмный ободок, блик сверху и символ.
"""
import glob
import os
import sys

from PIL import Image

MOD = sys.argv[1]
OUT = 'public/images/wiki/chat'
os.makedirs(OUT, exist_ok=True)

# Символ на поле 6×6 внутри монетки: W светлый, S тень символа, . фон.
ICONS = {
    'book': ((96, 62, 28), ['......', '.WWWS.', '.WSWS.', '.WWWS.', '.WWWS.', '......']),
    'pick': ((70, 78, 92), ['.WWWW.', '....SW', '...S.W', '..S...', '.S....', 'S.....']),
    'sword': ((44, 96, 150), ['....WW', '...WWW', 'S.WWW.', '.SWW..', '.SS...', 'S.....']),
    'gear': ((88, 88, 94), ['..WW..', '.WWWW.', 'WWSSWW', 'WWSSWW', '.WWWW.', '..WW..']),
    'cup': ((176, 124, 8), ['.WWWW.', 'SWWWWS', '.WWWW.', '..WW..', '..WW..', '.WWWW.']),
    'skull': ((60, 60, 66), ['.WWWW.', 'WWWWWW', 'WSWWSW', 'WWWWWW', '.WSSW.', '.WWWW.']),
    'clock': ((30, 120, 120), ['.WWWW.', 'WW.SWW', 'WW.SWW', 'WW..SW', 'WWWWWW', '.WWWW.']),
    'chest': ((122, 74, 24), ['.SSSS.', 'SWWWWS', 'SWWWWS', 'SSWWSS', 'SWWWWS', 'SWWWWS']),
    'pencil': ((132, 44, 120), ['....WW', '...WWW', '..WWW.', '.WWW..', 'SWW...', 'SS....']),
    'arrows': ((30, 128, 72), ['...W..', 'WWWWW.', '...W..', '..S...', '.SSSSS', '..S...']),
    'term': ((26, 34, 30), ['W.....', '.W....', '..W...', '.W....', 'W..SSS', '......']),
    'people': ((60, 84, 170), ['.WW.SS', '.WW.SS', '......', 'WWWWSS', 'WWWWSS', 'WWWWSS']),
    'new': ((24, 110, 240), ['..WW..', '..WW..', 'WWWWWW', 'WWWWWW', '..WW..', '..WW..']),
    'home': ((168, 72, 40), ['..WW..', '.WWWW.', 'WWWWWW', '.WSSW.', '.WSSW.', '.WSSW.']),
}


def shade(c, d):
    return tuple(max(0, min(255, v + d)) for v in c) + (255,)


def coin(base, glyph):
    img = Image.new('RGBA', (8, 8), (0, 0, 0, 0))
    for y in range(8):
        for x in range(8):
            corner = (x in (0, 7)) and (y in (0, 7))
            if corner:
                continue
            edge = x in (0, 7) or y in (0, 7)
            if edge:
                c = shade(base, -46 if y < 7 else -70)
            else:
                # блик сверху слева, снизу справа темнее
                c = shade(base, 26 - (x + y) * 4)
            img.putpixel((x, y), c)
    for y, row in enumerate(glyph):
        for x, ch in enumerate(row):
            if ch == 'W':
                img.putpixel((x + 1, y + 1), (255, 255, 255, 255))
            elif ch == 'S':
                img.putpixel((x + 1, y + 1), shade(base, -80))
    return img


for f in glob.glob(f'{MOD}/src/main/resources/assets/mistraly/textures/font/*_icon.png'):
    name = os.path.basename(f)[:-4].replace('_chat_icon', '').replace('_icon', '')
    Image.open(f).convert('RGBA').save(f'{OUT}/{name}.png', optimize=True)
for name, (base, glyph) in ICONS.items():
    coin(base, glyph).save(f'{OUT}/{name}.png', optimize=True)
print(sorted(os.listdir(OUT)))

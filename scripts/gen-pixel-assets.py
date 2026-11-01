#!/usr/bin/env python3
"""Генерирует пиксельные картинки сайта: логотип MISTRALY и полосы дизера.

Запуск из корня репозитория: python3 scripts/gen-pixel-assets.py
Нужен Pillow. Картинки лежат в public/images/ui и показываются
с целым масштабом и image-rendering: pixelated.
"""
import random
from PIL import Image

OUT = 'public/images/ui'

GLYPHS = {
    'M': ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
    'I': ['XXX', '.X.', '.X.', '.X.', '.X.', '.X.', 'XXX'],
    'S': ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'],
    'T': ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'],
    'R': ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
    'A': ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
    'L': ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
    'Y': ['X...X', 'X...X', '.X.X.', '..X..', '..X..', '..X..', '..X..'],
}

CELL = 4     # пикселей картинки в одном блоке буквы
DEPTH = 5    # глубина выдавливания вниз
OUTLINE = (5, 11, 30, 255)
# Вертикальная рампа лица букв: сверху светлое небо, снизу насыщенный синий.
RAMP = [(236, 247, 255), (196, 232, 255), (140, 208, 255), (98, 176, 255),
        (68, 142, 255), (47, 112, 240), (34, 88, 214)]
SIDE = [(20, 62, 168), (14, 48, 138), (10, 36, 108)]


def shade(c, d):
    return tuple(max(0, min(255, v + d)) for v in c) + (255,)


def logo():
    word = 'MISTRALY'
    w = sum(len(GLYPHS[c][0]) for c in word) + len(word) - 1
    h = 7
    pad = 2
    W, H = w * CELL + pad * 2, h * CELL + DEPTH + pad * 2
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rnd = random.Random(7)
    x0 = 0
    face = set()
    for c in word:
        g = GLYPHS[c]
        for ry, row in enumerate(g):
            for rx, ch in enumerate(row):
                if ch != 'X':
                    continue
                for sy in range(CELL):
                    for sx in range(CELL):
                        face.add(((x0 + rx) * CELL + sx + pad, ry * CELL + sy + pad))
        x0 += len(g[0]) + 1
    # Выдавливание: копии лица вниз, цвет темнеет с глубиной.
    for d in range(DEPTH, 0, -1):
        col = SIDE[min(2, (d - 1) * 3 // DEPTH)]
        for x, y in face:
            img.putpixel((x, y + d), shade(col, rnd.choice((-6, 0, 0, 6))))
    # Лицо с «блочной» фактурой: зерно по пикселям и светлая кромка сверху.
    for x, y in face:
        row = (y - pad) / (h * CELL)
        base = RAMP[min(len(RAMP) - 1, int(row * len(RAMP)))]
        d = rnd.choice((-14, -7, 0, 0, 0, 7, 12))
        if (x, y - 1) not in face:
            d = 26
        img.putpixel((x, y), shade(base, d))
    # Контур в один пиксель вокруг всего силуэта.
    px = img.load()
    edge = [(x, y) for y in range(H) for x in range(W) if px[x, y][3] == 0 and any(
        0 <= x + dx < W and 0 <= y + dy < H and px[x + dx, y + dy][3] > 0
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    for p in edge:
        px[p] = OUTLINE
    img.save(f'{OUT}/logo.png', optimize=True)
    print('logo', img.size)


BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def dither(name, rows, colour):
    """Полоса 4×rows: сверху прозрачно, снизу сплошной цвет, между — Байер."""
    img = Image.new('RGBA', (4, rows), (0, 0, 0, 0))
    for y in range(rows):
        level = (y + 0.5) / rows * 16
        for x in range(4):
            if BAYER[y % 4][x] < level:
                img.putpixel((x, y), colour + (255,))
    img.save(f'{OUT}/{name}.png', optimize=True)


logo()
dither('dither-page', 12, (11, 26, 62))   # --bg-page
dither('dither-panel', 8, (18, 42, 92))   # --panel
dither('dither-void', 12, (6, 13, 34))    # тёмная полоса лора

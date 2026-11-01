#!/usr/bin/env python3
"""Генерирует пиксельные картинки сайта: полосы дизера.

Запуск из корня репозитория: python3 scripts/gen-pixel-assets.py
Нужен Pillow. Картинки лежат в public/images/ui и показываются
с целым масштабом и image-rendering: pixelated.
"""
import random

from PIL import Image

OUT = 'public/images/ui'

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



def block_tile():
    """Плитка фона как блок в игре, своя: тёмные пиксели и светлые крапины поверх цвета страницы."""
    rnd = random.Random(11)
    size = 32
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    for y in range(size):
        # слои, как у глубинного сланца: полосы чуть темнее
        band = 16 if (y // 4) % 2 == 0 else 34
        for x in range(size):
            r = rnd.random()
            if r < 0.5:
                img.putpixel((x, y), (0, 0, 0, band + rnd.randint(0, 26)))
            elif r < 0.72:
                img.putpixel((x, y), (255, 255, 255, rnd.randint(3, 9)))
    # швы между блоками: у каждой плитки 16×16 тёмный край
    for i in range(size):
        for a, b in ((i, 15), (i, 31), (15, i), (31, i)):
            img.putpixel((a, b), (0, 0, 0, 74))
    img.save(f'{OUT}/block-tile.png', optimize=True)


block_tile()
dither('dither-page', 12, (18, 18, 18))   # --bg-page
dither('dither-panel', 8, (26, 26, 26))   # --panel
dither('dither-void', 12, (12, 12, 12))    # тёмная полоса лора

#!/usr/bin/env python3
"""Генерирует пиксельные картинки сайта: полосы дизера.

Запуск из корня репозитория: python3 scripts/gen-pixel-assets.py
Нужен Pillow. Картинки лежат в public/images/ui и показываются
с целым масштабом и image-rendering: pixelated.
"""
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



dither('dither-page', 12, (18, 18, 18))   # --bg-page
dither('dither-panel', 8, (26, 26, 26))   # --panel
dither('dither-void', 12, (12, 12, 12))    # тёмная полоса лора

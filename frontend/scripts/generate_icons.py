"""Génère les icônes PWA (app icon, apple-touch-icon, maskable) à partir du
motif de logo déjà utilisé dans Header.jsx (carré dégradé indigo->purple->pink
avec l'icône Radio blanche). Pas d'outil de rasterisation SVG dispo dans
l'environnement, donc dessin direct en pixels via PIL/numpy.
"""
import numpy as np
from PIL import Image, ImageDraw
import os

SIZE = 1024
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

# Couleurs Tailwind : indigo-600, purple-600, pink-500
C1 = np.array([79, 70, 229])    # #4f46e5
C2 = np.array([147, 51, 234])   # #9333ea
C3 = np.array([236, 72, 153])   # #ec4899


def make_gradient(size):
    # Dégradé diagonal "to top right" en 2 étapes (indigo->purple->pink),
    # approximé par interpolation le long de la diagonale (bas-gauche -> haut-droit).
    y, x = np.mgrid[0:size, 0:size]
    # t=0 en bas-gauche, t=1 en haut-droite
    t = ((x / (size - 1)) + (1 - y / (size - 1))) / 2
    t = np.clip(t, 0, 1)

    half = t < 0.5
    local_t = np.where(half, t / 0.5, (t - 0.5) / 0.5)[..., None]
    color_a = np.where(half[..., None], C1, C2)
    color_b = np.where(half[..., None], C2, C3)
    rgb = (color_a + (color_b - color_a) * local_t).astype(np.uint8)
    return rgb


def draw_radio_glyph(img, cx, cy, scale):
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255, 255)
    dot_r = 0.09 * scale
    draw.ellipse(
        [cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=white
    )
    stroke = max(2, int(0.075 * scale))
    for i, r in enumerate([0.32 * scale, 0.52 * scale]):
        bbox = [cx - r, cy - r, cx + r, cy + r]
        draw.arc(bbox, start=-55, end=-125, fill=white, width=stroke)
        draw.arc(bbox, start=125, end=55, fill=white, width=stroke)


def build_master():
    rgb = make_gradient(SIZE)
    img = Image.fromarray(rgb, mode="RGB").convert("RGBA")
    draw_radio_glyph(img, SIZE / 2, SIZE / 2, SIZE * 0.42)
    return img


def build_maskable():
    # Zone de sécurité ~66% pour les icônes maskable Android : même dégradé
    # continu plein cadre, glyphe rétréci pour ne pas être rogné par le masque OS.
    rgb = make_gradient(SIZE)
    img = Image.fromarray(rgb, mode="RGB").convert("RGBA")
    draw_radio_glyph(img, SIZE / 2, SIZE / 2, SIZE * 0.30)
    return img


master = build_master()
maskable = build_maskable()

targets = [
    (master, "icon-180.png", 180),
    (master, "icon-192.png", 192),
    (master, "icon-512.png", 512),
    (maskable, "maskable-512.png", 512),
]

for source, name, size in targets:
    resized = source.resize((size, size), Image.LANCZOS)
    resized.save(os.path.join(OUT_DIR, name))
    print("wrote", name, resized.size)

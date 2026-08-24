"""Génère les icônes de l'app Expo (iOS icon, Android adaptive icon,
monochrome, favicon web) avec le même motif que le PWA web : dégradé
indigo->purple->pink + glyph radar blanc.
"""
import numpy as np
from PIL import Image, ImageDraw
import os

SIZE = 1024
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets")

C1 = np.array([79, 70, 229])    # indigo-600
C2 = np.array([147, 51, 234])   # purple-600
C3 = np.array([236, 72, 153])   # pink-500


def make_gradient(size):
    y, x = np.mgrid[0:size, 0:size]
    t = ((x / (size - 1)) + (1 - y / (size - 1))) / 2
    t = np.clip(t, 0, 1)
    half = t < 0.5
    local_t = np.where(half, t / 0.5, (t - 0.5) / 0.5)[..., None]
    color_a = np.where(half[..., None], C1, C2)
    color_b = np.where(half[..., None], C2, C3)
    return (color_a + (color_b - color_a) * local_t).astype(np.uint8)


def draw_radio_glyph(img, cx, cy, scale, color=(255, 255, 255, 255)):
    draw = ImageDraw.Draw(img)
    dot_r = 0.09 * scale
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=color)
    stroke = max(2, int(0.075 * scale))
    for r in [0.32 * scale, 0.52 * scale]:
        bbox = [cx - r, cy - r, cx + r, cy + r]
        draw.arc(bbox, start=-55, end=-125, fill=color, width=stroke)
        draw.arc(bbox, start=125, end=55, fill=color, width=stroke)


def gradient_image(size):
    return Image.fromarray(make_gradient(size), mode="RGB").convert("RGBA")


# icon.png : iOS + fallback général, fond opaque plein cadre (pas de coins arrondis,
# pas de transparence : iOS masque et rejette l'alpha lui-même)
icon = gradient_image(SIZE)
draw_radio_glyph(icon, SIZE / 2, SIZE / 2, SIZE * 0.42)
icon.convert("RGB").save(os.path.join(OUT_DIR, "icon.png"))

# adaptive icon Android : foreground (glyph seul, transparent, zone de sécurité ~66%)
foreground = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw_radio_glyph(foreground, SIZE / 2, SIZE / 2, SIZE * 0.30)
foreground.save(os.path.join(OUT_DIR, "android-icon-foreground.png"))

# adaptive icon Android : background (dégradé plein cadre)
background = gradient_image(SIZE)
background.convert("RGB").save(os.path.join(OUT_DIR, "android-icon-background.png"))

# monochrome (Android 13+ themed icons) : glyph blanc seul sur transparent
monochrome = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw_radio_glyph(monochrome, SIZE / 2, SIZE / 2, SIZE * 0.30, color=(255, 255, 255, 255))
monochrome.save(os.path.join(OUT_DIR, "android-icon-monochrome.png"))

# favicon web (fallback expo web)
favicon = icon.resize((196, 196), Image.LANCZOS)
favicon.convert("RGB").save(os.path.join(OUT_DIR, "favicon.png"))

# splash icon : juste le glyph blanc, transparent, affiché sur fond uni (app.json backgroundColor)
splash = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw_radio_glyph(splash, SIZE / 2, SIZE / 2, SIZE * 0.30, color=(79, 70, 229, 255))
splash.save(os.path.join(OUT_DIR, "splash-icon.png"))

print("done")

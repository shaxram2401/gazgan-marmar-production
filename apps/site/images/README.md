# Images folder structure

Replace placeholder paths in HTML/JS with optimized local images.

```
images/
├── hero/
│   ├── hero-marble-bg.jpg        (2400×1600, WebP recommended) — luxury black marble interior
│   └── hero-overlay.jpg          (2000×1200, blend overlay)
├── products/
│   ├── white-marble.jpg          (1600×1200)
│   ├── black-marble.jpg          (1200×900)
│   ├── granite.jpg               (1200×900)
│   ├── travertine.jpg            (1600×1200)
│   └── decorative-stones.jpg     (1200×900)
├── entrepreneurs/
│   ├── ent-01.jpg ... ent-12.jpg (optional company/owner portraits, 800×800)
├── gallery/
│   ├── g-01.jpg ... g-08.jpg     (mixed sizes — see grid)
├── ceo/
│   └── founder-portrait.jpg      (900×1100)
└── og/
    └── og-cover.jpg              (1200×630, social share card)
```

## Optimization guidelines

- Format: `.jpg` (quality 82) for photos, `.webp` for next-gen, `.svg` for logos/icons.
- Max width: 2400px (hero), 1600px (products/gallery), 900px (avatars/portraits).
- Use `loading="lazy"` (auto-applied by script.js for all non-hero images).
- Total page weight target: < 1.5 MB on first paint.

## Recommended tools
- [squoosh.app](https://squoosh.app) — single-image WebP/AVIF conversion.
- `cwebp -q 82 input.jpg -o output.webp` — batch.
- Vercel auto-serves AVIF/WebP if you place originals here and reference them via `<img>`.

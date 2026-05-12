# Gazgan Marmo — Production Website

Premium marble & granite export platform · Gazgan, Uzbekistan.

Static site, zero build step. Ready for **GitHub + Vercel** in 60 seconds.

---

## 📁 Structure

```
gazgan-marmo/
├── index.html              # Main page (semantic, SEO, schema)
├── style.css               # All styles
├── script.js               # All JS — analytics, lead capture, modals
├── manifest.json           # PWA manifest
├── robots.txt              # SEO crawler rules
├── sitemap.xml             # SEO sitemap
├── vercel.json             # Vercel headers, caching, redirects
├── favicon.ico             # Multi-size favicon
├── favicon.svg             # Vector favicon
├── og-cover.jpg            # Social share image (1200×630)
├── icons/                  # PWA & touch icons (16 / 32 / 180 / 192 / 512)
├── images/                 # Photo assets (see images/README.md)
│   ├── hero/
│   ├── products/
│   ├── entrepreneurs/
│   ├── gallery/
│   └── og/
└── catalog/                # Export catalog PDFs
```

---

## 🚀 Deploy to Vercel

### Option A — GitHub + Vercel (recommended)

```bash
git init
git add .
git commit -m "Initial production deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USER/gazgan-marmo.git
git push -u origin main
```

1. Open [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repo
3. **Framework Preset:** Other  ·  **Build Command:** *(leave empty)*  ·  **Output:** `.`
4. Deploy

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

### Custom domain

Vercel dashboard → Settings → Domains → add `gazganmarmo.uz` and update DNS:
```
A      @     76.76.21.21
CNAME  www   cname.vercel-dns.com
```

---

## ⚙️ Configuration

Edit `index.html` → `window.GAZGAN_CONFIG` block:

```js
whatsappNumber: '998901112233',         // E.164 without +
callNumber:     '+998901112233',
email:          'export@gazganmarmo.uz',
catalogUrl:     '/catalog/Gazgan-Marmo-Export-Catalog-2026.pdf',
firebase:       { ... },                // Firebase project credentials
endpoints:      { ... }                 // Backend REST URLs
```

---

## 📊 Analytics — enable at deployment

In `index.html`, uncomment & replace IDs:

| Service             | Where                                  | Token |
|---------------------|----------------------------------------|-------|
| Google Analytics 4  | `<!-- Google Analytics 4 -->` block    | `G-XXXXXXXXXX` |
| Meta Pixel          | `<!-- Meta (Facebook) Pixel -->` block | `XXXXXXXXXXXXXXX` |
| Google Search Console | `google-site-verification` meta      | GSC token |
| Yandex Webmaster    | `yandex-verification` meta             | Yandex token |
| Facebook domain     | `facebook-domain-verification` meta    | FB token |

Tracked events:
`lead_submit`, `catalog_download`, `whatsapp_click`, `phone_call_click`, `language_switch`

---

## 🔥 Firebase setup (optional)

1. [console.firebase.google.com](https://console.firebase.google.com) → create project `gazgan-marmo`.
2. Add Web App → copy config into `GAZGAN_CONFIG.firebase`.
3. Enable **Firestore** in production mode.
4. In `index.html`, uncomment the `<!-- FIREBASE INTEGRATION -->` block.
5. Firestore collections will auto-create on first submit:

```
inquiries/        — lead documents (status, assignedTo, leadType, payload)
products/         — CMS products
entrepreneurs/    — alliance members
gallery/          — gallery items
testimonials/     — testimonials
exportCountries/  — country list
```

### Firestore security rules (starter)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /inquiries/{doc} {
      allow create: if request.resource.data.keys().hasAll(
        ['name','country','company','whatsapp','email','leadType','product']);
      allow read, update, delete: if request.auth != null;
    }
    match /{public=**}/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 💼 Lead capture flow

```
User submits form
     ↓
Validate required fields
     ↓
Enrich payload (source, UA, referrer, timestamp)
     ↓
saveLead()  →  Firebase / REST API / console fallback
     ↓
Track analytics event
     ↓
Open WhatsApp Business with formatted business message
     ↓
Email fallback link displayed
```

Routing by `leadType` → `GAZGAN_CONFIG.leadRouting`:
- `investor`      → ir@gazganmarmo.uz
- `buyer`         → export@gazganmarmo.uz
- `distributor`   → partners@gazganmarmo.uz
- (default)       → export@gazganmarmo.uz

---

## 🖼️ Images

Replace Unsplash URLs in `index.html` with optimized local images in `/images/`.
See `images/README.md` for sizes & format guidelines.

---

## 📄 Catalog PDF

Place export catalog at `/catalog/Gazgan-Marmo-Export-Catalog-2026.pdf` and update `GAZGAN_CONFIG.catalogUrl` if filename changes.

---

## ✅ Pre-launch checklist

- [ ] Replace WhatsApp / email / phone in `GAZGAN_CONFIG`
- [ ] Replace placeholder analytics IDs
- [ ] Upload real product photos to `/images/`
- [ ] Upload export catalog PDF
- [ ] Add real entrepreneur contacts in HTML (or migrate to Firestore)
- [ ] Verify domain in Google Search Console & Yandex Webmaster
- [ ] Test contact form end-to-end (WhatsApp + email + Firebase)
- [ ] Run Lighthouse → target 90+ on all metrics
- [ ] Submit sitemap.xml to GSC

---

© 2026 Gazgan Marmo Alliance LLC · License №UZ-EXP-2024-1142

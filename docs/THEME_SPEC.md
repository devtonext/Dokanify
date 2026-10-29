# NexDrop Theme Spec v1

Every storefront template uploaded to NexDrop must follow this structure.
**Any React + Vite app can become a theme**, but a plain Vite app is not editable:
its text and images are hardcoded. A NexDrop theme instead *declares* what is
editable (JSON schemas) and *reads* those values at runtime through
`@nexdrop/theme-sdk`. That is what lets the admin unlock content, image, color
and section editing per template.

A complete working example lives in [`themes/lumiere`](../themes/lumiere).

---

## 1. Zip layout

```
my-theme-1.0.0.zip
├── theme.json                  ← manifest (required)
├── schema/
│   ├── settings.json           ← global settings: colors, fonts, header, footer… (required)
│   └── sections/
│       ├── hero.json           ← one file per section listed in theme.json (required)
│       └── …
├── defaults/
│   └── content.json            ← demo content every new store starts from (required)
├── dist/                       ← `vite build` output (required)
│   ├── index.html
│   ├── assets/…
│   └── images/…                ← demo images (Vite `public/` folder)
├── preview/
│   ├── cover.png               ← marketplace card (recommended, 4:3)
│   └── screenshots/*.png       ← gallery (optional)
└── source/                     ← full source, delivered to marketplace buyers (recommended)
```

A single wrapping folder (`my-theme/theme.json`) is fine; it is stripped.

### Upload rules (enforced by the validator)

| Rule | Why |
| --- | --- |
| `dist/index.html` must use **relative** asset paths: set `base: './'` in `vite.config` | Themes are served from `/t/<theme>/<version>/` and `/s/<store>/` |
| Allowed in `dist/`: html, css, js, json, images, fonts, mp4/webm/mp3 | No server code is ever executed |
| Blocked anywhere: `.php .sh .py .exe .jar .bat …` | Safety |
| Max 80 MB zip, 400 MB extracted, 30 MB per file, 3000 files | Zip-bomb protection |
| No `..` or absolute paths in the zip | Zip-slip protection |
| `version` must be new for that theme `id` | Versions are immutable and cached forever |
| Bundles should include `@nexdrop/theme-sdk` | Otherwise the editor can't live-update the theme (warning) |

Check a zip locally before uploading:

```bash
npm run theme:validate path/to/my-theme-1.0.0.zip
```

---

## 2. `theme.json`

```json
{
  "id": "lumiere-fashion",
  "name": "Lumière Fashion",
  "version": "1.0.0",
  "niche": "fashion",
  "description": "Elegant bilingual fashion storefront",
  "author": "NexDrop",
  "sdkVersion": "1",
  "features": ["catalog", "cart", "checkout", "search", "cod", "bkash", "nagad", "bilingual"],
  "pages": ["home", "collection", "product", "cart", "checkout"],
  "sections": ["hero", "featured-products", "product-main", "cart-main", "checkout-main"],
  "minPlan": "free",
  "changelog": "Initial release."
}
```

| Field | Notes |
| --- | --- |
| `id` | kebab-case, permanent. Uploading the same `id` with a higher `version` adds a version. |
| `niche` | `fashion electronics grocery food beauty furniture kids sports books handmade jewellery pharmacy general` |
| `features` | What the theme supports — see §5. Payment methods appear at checkout only if listed here. |
| `pages` | Page templates. Each gets its own ordered list of sections in the editor. |
| `sections` | Every section type; each needs `schema/sections/<type>.json`. |
| `minPlan` | `free`, `pro` or `business`: the lowest store plan allowed to install the theme. |

---

## 3. Schemas: what the merchant can edit

### `schema/settings.json`: global settings, grouped

```json
{
  "groups": [
    { "id": "colors", "label": "Colors", "fields": [
      { "key": "colorPrimary", "type": "color", "label": "Primary", "default": "#1f2937" }
    ]},
    { "id": "header", "label": "Header", "fields": [
      { "key": "logo", "type": "image", "label": "Logo" },
      { "key": "menu", "type": "list", "label": "Menu links", "maxItems": 8, "fields": [
        { "key": "label", "type": "text", "label": "Label", "localized": true },
        { "key": "link", "type": "link", "label": "Link" }
      ]}
    ]}
  ]
}
```

### `schema/sections/<type>.json`: one reorderable section

```json
{
  "type": "hero",
  "label": "Hero slideshow",
  "description": "Full-width banner",
  "pages": ["home"],
  "unique": false,
  "minPlan": "free",
  "fields": [
    { "key": "heading", "type": "text", "label": "Heading", "localized": true },
    { "key": "image", "type": "image", "label": "Background" },
    { "key": "overlay", "type": "range", "label": "Darkness", "min": 0, "max": 80, "default": 35 },
    { "key": "autoplay", "type": "toggle", "label": "Auto-rotate", "minPlan": "pro" }
  ]
}
```

* `pages`: which page templates may contain it (omit = any).
* `unique`: at most one per page (e.g. `product-main`).
* `minPlan` on a **section**: stores on lower plans can't add it.
* `minPlan` on a **field**: shown locked in the editor and kept at its default on lower plans (enforced server-side).

### Field types

| type | value saved | editor control |
| --- | --- | --- |
| `text`, `textarea`, `richtext` | string, or `{ "en", "bn" }` when `localized: true` | input / textarea |
| `image` | URL or theme-relative path (`images/hero.jpg`) | upload + URL |
| `gallery` | string[] | multi-upload |
| `color` | `#rrggbb` | color picker |
| `font` | Google Font family | font picker (incl. Hind Siliguri, Noto Sans Bengali, Tiro Bangla…) |
| `select` | one of `options[].value` | dropdown |
| `toggle` | boolean | switch |
| `number`, `range` | number (`min`, `max`, `step`) | input / slider |
| `link` | `/collection/all`, `/product/slug` or `https://…` | input |
| `product` | product slug from the store | product picker |
| `collection` | category name or `all` | category picker |
| `list` | array of objects (`fields`, `maxItems`) | repeatable, reorderable items |

Keys are camelCase and unique within their group, section or list.

---

## 4. `defaults/content.json`: demo content

The exact shape the editor saves and the SDK reads:

```json
{
  "settings": { "colorPrimary": "#1f2937", "menu": [{ "label": { "en": "Men", "bn": "পুরুষ" }, "link": "/collection/Men" }] },
  "pages": {
    "home": { "sections": [
      { "id": "hero-main", "type": "hero", "settings": { "heading": { "en": "Eid Collection", "bn": "ঈদ কালেকশন" }, "image": "images/hero.jpg" } }
    ]},
    "product": { "sections": [ { "id": "product-main", "type": "product-main", "settings": {} } ] }
  }
}
```

Section `id`s must be unique per page. When the merchant adds a section,
the editor copies the first instance of that type found here as its preset.

---

## 5. Features and plan unlocking

| Feature | Meaning |
| --- | --- |
| `catalog`, `search`, `cart`, `checkout` | Core shop |
| `cod`, `bkash`, `nagad`, `rocket`, `sslcommerz` | Payment methods the checkout UI supports |
| `bilingual` | English / বাংলা toggle (editor shows EN/বাংলা inputs) |
| `blog`, `wishlist`, `reviews`, `order-tracking`, `custom-domain` | Optional modules |

A capability is available on a live store only when **all three** agree:

1. the **theme** declares the feature,
2. the store's **plan** unlocks it (Settings → Plans), and
3. the **store** enabled it (for example a bKash gateway in Settings → Payments).

The SDK's `useCheckout().paymentMethods` and `useFeature()` already apply this rule.

---

## 6. Runtime: `@nexdrop/theme-sdk`

```tsx
// main.tsx
<NexdropProvider
  fallbackContent={defaults}                         // your defaults/content.json
  devConfig={{ store: 'demo', apiBase: 'http://localhost:3000/api/storefront/demo' }}
  pagePaths={{ home: '/', collection: '/collection/all', product: '/product/:first', cart: '/cart', checkout: '/checkout' }}
>
  <App />
</NexdropProvider>

// App.tsx: map hash routes to page templates, render that page's sections
<Header />                                           {/* reads useThemeSettings() */}
<Sections page={page} components={{ hero: Hero, 'product-main': ProductMain, … }} />
<Footer />

// a section component receives its settings
function Hero({ settings }) {
  const { t } = useLocale()
  const asset = useAsset()
  return <h1 style={{ backgroundImage: `url(${asset(settings.image)})` }}>{t(settings.heading)}</h1>
}
```

**Rules**

1. **Hash routing only** (`#/product/slug`). Use the SDK's `Link`, `navigate`, `useRoute` and `matchPath`.
2. **Never hardcode merchant content.** Every text, image, color or link a merchant may change belongs in a schema.
3. Resolve every image through `useAsset()` (it handles theme-relative paths and admin uploads).
4. Prices come from the API (BDT). Use `formatPrice()`. Totals and shipping are always recomputed on the server.
5. Don't render merchant text as HTML.
6. Don't rely on `localStorage` or cookies in previews: the editor preview runs sandboxed (the SDK handles this for the cart and locale).

**Local development:** run the admin on `:3000`, then `npm run dev` in the theme.
The SDK loads the real products of store `demo` and falls back to your `defaults/content.json`.

**Publishing:** `npm run package` builds and zips the theme. Then go to Admin → Themes → Upload theme.

---

## 7. Lifecycle

```
upload zip ─► validate ─► Theme (DRAFT) + Version 1.0.0
                              │ review/publish
                              ▼
                       PUBLISHED ─► /api/public/themes + marketplace webhook (NexDrop site)
                              │ store installs
                              ▼
               ThemeInstall (draft content) ─► editor ─► Publish ─► live at /s/<store>/
upload 1.1.0 ─► "Release" ─► stores see "Update theme" in the editor (content migrated)
```

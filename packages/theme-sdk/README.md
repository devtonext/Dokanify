# @nexdrop/theme-sdk

The runtime that makes a React theme editable in the NexDrop admin and connects it to a store.

```tsx
import { NexdropProvider, Sections, useThemeSettings, useLocale, useProducts, useCart } from '@nexdrop/theme-sdk'
import defaults from '../defaults/content.json'

createRoot(root).render(
  <NexdropProvider fallbackContent={defaults} pagePaths={{ home: '/', product: '/product/:first', cart: '/cart' }}>
    <App />
  </NexdropProvider>
)

function Home() {
  return <Sections page="home" components={{ hero: Hero, 'featured-products': FeaturedProducts }} />
}

function Hero({ settings }) {
  const { t } = useLocale()
  const asset = useAsset()
  return <section style={{ backgroundImage: `url(${asset(settings.image)})` }}><h1>{t(settings.title)}</h1></section>
}
```

| Hook / component | Purpose |
| --- | --- |
| `NexdropProvider` | Loads store + content, connects to the admin editor (live preview, click-to-select). |
| `Sections` | Renders a page's sections in the order/visibility set in the editor. |
| `useThemeSettings()` | Global settings (colors, fonts, logo, header/footer…). |
| `useLocale()` | `t(value)` for localized fields, `locale`, `setLocale`, `formatPrice`. |
| `useAsset()` | Resolves theme-relative images and admin-uploaded media. |
| `useProducts(query)`, `useProduct(slug)`, `useCategories()` | Store catalogue. |
| `useCart()` | Persistent cart (add/update/remove/clear, count, subtotal). |
| `useCheckout()` | Payment methods allowed for this store+plan+theme, districts, shipping estimate, `placeOrder()`. |
| `useRoute()`, `Link`, `navigate`, `matchPath` | Hash router — works under any base path and inside the editor. |
| `useFeature(name)` | Whether the theme *and* the store's plan support a feature. |

Rules: use hash routing (`#/product/slug`), build with `base: './'`, never hardcode text/images that the merchant should edit — put them in a schema.

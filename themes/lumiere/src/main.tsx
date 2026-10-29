import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { NexdropProvider, type ThemeContent } from '@nexdrop/theme-sdk'
import defaults from '../defaults/content.json'
import { App } from './App'
import './theme.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NexdropProvider
      fallbackContent={defaults as ThemeContent}
      // Used only during `npm run dev` (point it at one of your stores) — when uploaded, NexDrop injects the real config.
      devConfig={{ store: 'my-store', apiBase: 'http://localhost:3000/api/storefront/my-store' }}
      pagePaths={{ home: '/', collection: '/collection/all', product: '/product/:first', cart: '/cart', checkout: '/checkout' }}
    >
      <App />
    </NexdropProvider>
  </StrictMode>
)

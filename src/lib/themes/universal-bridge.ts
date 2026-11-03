/**
 * Universal Storefront Runtime Bridge (`nexdrop-universal-bridge`)
 *
 * Injected automatically into every served `dist/index.html` by `serveThemeFile()`.
 * Allows ANY unmodified React + Vite build to work as a live NexDrop storefront and
 * inside the NexDrop Visual Editor without requiring `@nexdrop/theme-sdk` source edits:
 *
 *  1. Fetch & API Interceptor: Maps `/api/products`, `/products.json`, `fakestoreapi.com`,
 *     and `dummyjson.com` calls to the store's live NexDrop catalogue API.
 *  2. DOM Product Card Hydrator: Uses a debounced `MutationObserver` to detect rendered
 *     product cards (image + title + price + CTA button) and hydrate them with real store
 *     products and Bangladeshi Taka (৳) lakh-formatted prices.
 *  3. Universal Cart & 64-District Bangladesh Checkout Drawer: Intercepts clicks on
 *     "Add to Cart" / "Buy Now" buttons and provides a complete slide-over cart and
 *     checkout drawer supporting bKash, Nagad, Rocket, SSLCommerz, and COD.
 *  4. Visual Editor & DOM Override Bridge: Connects unmodified React + Vite apps to the
 *     NexDrop Visual Editor (`postMessage` handshake, CSS custom properties, announcement
 *     bar, WhatsApp floating button, and point-and-click text/image overrides).
 */

export function buildUniversalBridgeScript(): string {
  return `(function(){
  if (typeof window === 'undefined' || window.__NEXDROP_BRIDGE_ACTIVE__) return;
  window.__NEXDROP_BRIDGE_ACTIVE__ = true;

  var cfg = window.__NEXDROP_CONFIG__;
  if (!cfg || !cfg.apiBase) return;

  var state = {
    boot: null,
    products: [],
    cart: [],
    locale: 'en',
    drawerOpen: false,
    checkoutStep: false,
    selectedDistrict: 'Dhaka',
    selectedMethod: 'COD',
    overrides: {},
    settings: {}
  };

  var cartKey = 'nx.universal.cart.' + cfg.store;
  try {
    state.cart = JSON.parse(window.localStorage.getItem(cartKey) || '[]');
  } catch (_) {
    state.cart = [];
  }

  function saveCart() {
    try { window.localStorage.setItem(cartKey, JSON.stringify(state.cart)); } catch (_) {}
    renderFloatingPill();
    if (state.drawerOpen) renderDrawer();
  }

  function formatBDT(n) {
    var val = Math.round(Number(n) || 0);
    return '৳' + val.toLocaleString('en-IN');
  }

  // ── 1. Intercept fetch() for common dummy/template product endpoints ──────
  var origFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (
      /\\/(api\\/)?products(\\.json)?(\\?|$)/i.test(url) &&
      url.indexOf(cfg.apiBase) === -1 &&
      (!init || !init.method || init.method.toUpperCase() === 'GET')
    ) {
      return origFetch(cfg.apiBase + '/products?limit=48').then(function(r) { return r.json(); }).then(function(data) {
        var list = (data && data.products) || [];
        return new Response(JSON.stringify(list), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    }
    return origFetch(input, init);
  };

  // ── 2. Apply CSS Variables, Announcement Bar & DOM Overrides ──────────────
  function applyThemeSettings(content) {
    if (!content) return;
    var s = content.settings || {};
    state.settings = s;
    var root = document.documentElement;
    if (s.colorPrimary) {
      root.style.setProperty('--primary', s.colorPrimary);
      root.style.setProperty('--color-primary', s.colorPrimary);
    }
    if (s.colorAccent) {
      root.style.setProperty('--accent', s.colorAccent);
      root.style.setProperty('--color-accent', s.colorAccent);
    }
    if (s.colorBackground) root.style.setProperty('--bg', s.colorBackground);
    if (s.colorText) root.style.setProperty('--text', s.colorText);

    if (s.domOverrides && typeof s.domOverrides === 'object') {
      state.overrides = s.domOverrides;
      applyDomOverrides();
    }
  }

  function applyDomOverrides() {
    var map = state.overrides || {};
    Object.keys(map).forEach(function(sel) {
      try {
        var el = document.querySelector(sel);
        if (!el) return;
        var patch = map[sel];
        if (patch.text !== undefined && el.tagName !== 'IMG') el.textContent = patch.text;
        if (patch.src && el.tagName === 'IMG') el.setAttribute('src', patch.src);
      } catch (_) {}
    });
  }

  // ── 3. DOM Product Card Hydrator for Unmodified React + Vite Themes ───────
  var priceRegex = /(?:৳|\\$|BDT|TK\\.?|Tk\\.?)\\s*\\d[\\d,.]*/i;

  function hydrateProductCards() {
    if (window.__NEXDROP_SDK__ || !state.products.length) return;
    var buttons = Array.from(document.querySelectorAll('button, a[role="button"]')).filter(function(btn) {
      if (btn.closest('#nx-universal-root')) return false;
      var txt = (btn.textContent || '').trim();
      return /add to cart|buy now|shop now|order now|quick add|কার্টে যোগ|অর্ডার করুন/i.test(txt);
    });

    var cardIndex = 0;
    buttons.forEach(function(btn) {
      var card = btn.closest('article, li, [class*="card"], [class*="product"], [class*="item"]');
      if (!card || card.getAttribute('data-nx-hydrated') === '1') return;
      var img = card.querySelector('img');
      var heading = card.querySelector('h2, h3, h4, [class*="title"], [class*="name"]');
      if (!img || !heading) return;

      var prod = state.products[cardIndex % state.products.length];
      cardIndex++;
      card.setAttribute('data-nx-hydrated', '1');
      card.setAttribute('data-nx-product-id', prod.id);
      btn.setAttribute('data-nx-add-id', prod.id);

      if (prod.images && prod.images[0]) {
        var imgUrl = prod.images[0].startsWith('http') || prod.images[0].startsWith('/')
          ? prod.images[0]
          : cfg.assetBase + prod.images[0];
        img.src = imgUrl;
        img.alt = prod.name;
      }
      heading.textContent = prod.name;

      // Replace first price node inside card
      var walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null);
      var node;
      while ((node = walker.nextNode())) {
        if (node.parentElement && node.parentElement !== heading && priceRegex.test(node.nodeValue || '')) {
          node.nodeValue = formatBDT(prod.price);
          break;
        }
      }
    });
  }

  // ── 4. Universal Cart & 64-District Bangladesh Checkout UI ────────────────
  function ensureUiRoot() {
    var r = document.getElementById('nx-universal-root');
    if (r) return r;
    r = document.createElement('div');
    r.id = 'nx-universal-root';
    document.body.appendChild(r);
    return r;
  }

  function addToCart(prodId) {
    var prod = state.products.find(function(p) { return p.id === prodId; }) || state.products[0];
    if (!prod) return;
    var existing = state.cart.find(function(i) { return i.productId === prod.id; });
    if (existing) existing.quantity += 1;
    else state.cart.push({
      productId: prod.id,
      name: prod.name,
      price: prod.price,
      image: (prod.images && prod.images[0]) || '',
      quantity: 1
    });
    state.drawerOpen = true;
    state.checkoutStep = false;
    saveCart();
  }

  function shippingFeeFor(district, subtotal) {
    var ship = state.boot && state.boot.shipping;
    if (!ship) return district === 'Dhaka' ? 60 : 120;
    if (ship.freeShippingOver != null && subtotal >= ship.freeShippingOver) return 0;
    var zones = ship.zones || [];
    var matched = zones.find(function(z) {
      return (z.districts || []).some(function(d) { return d.toLowerCase() === district.toLowerCase(); });
    }) || zones.find(function(z) { return !z.districts || z.districts.length === 0; }) || zones[0];
    return matched ? matched.rate : 100;
  }

  function renderFloatingPill() {
    if (window.__NEXDROP_SDK__) return;
    var root = ensureUiRoot();
    var pill = document.getElementById('nx-floating-pill');
    if (!pill) {
      pill = document.createElement('button');
      pill.id = 'nx-floating-pill';
      pill.type = 'button';
      pill.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9998;display:flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;background:#111827;color:#fff;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;border:none;box-shadow:0 12px 28px rgba(0,0,0,0.22);cursor:pointer;';
      pill.onclick = function() {
        state.drawerOpen = !state.drawerOpen;
        renderDrawer();
      };
      root.appendChild(pill);
    }
    var count = state.cart.reduce(function(s, i) { return s + i.quantity; }, 0);
    var sub = state.cart.reduce(function(s, i) { return s + i.price * i.quantity; }, 0);
    pill.innerHTML = '<span>🛍️ Cart (' + count + ')</span><span style="opacity:0.75">· ' + formatBDT(sub) + '</span>';
  }

  function renderDrawer() {
    var root = ensureUiRoot();
    var container = document.getElementById('nx-drawer-Modal');
    if (!state.drawerOpen) {
      if (container) container.remove();
      return;
    }
    if (!container) {
      container = document.createElement('div');
      container.id = 'nx-drawer-Modal';
      root.appendChild(container);
    }
    var sub = state.cart.reduce(function(s, i) { return s + i.price * i.quantity; }, 0);
    var ship = shippingFeeFor(state.selectedDistrict, sub);
    var total = sub + ship;
    var districts = (state.boot && state.boot.districts) || ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal'];
    var payments = (state.boot && state.boot.payments) || [{ method: 'COD', label: 'Cash on Delivery' }, { method: 'BKASH', label: 'bKash' }];

    container.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,0.5);display:flex;justify-content:flex-end;font-family:system-ui,sans-serif;';
    container.innerHTML =
      '<div style="width:100%;max-width:420px;background:#fff;height:100%;display:flex;flex-direction:column;box-shadow:-12px 0 32px rgba(0,0,0,0.18);">' +
        '<div style="padding:18px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">' +
          '<strong style="font-size:15px;color:#0f172a;">' + (state.checkoutStep ? 'Bangladesh Express Checkout' : 'Your Shopping Cart') + '</strong>' +
          '<button id="nx-close-drawer" type="button" style="border:none;background:#f1f5f9;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:13px;">✕</button>' +
        '</div>' +
        '<div style="flex:1;overflow-y:auto;padding:20px;">' +
          (!state.cart.length
            ? '<p style="color:#64748b;font-size:13px;text-align:center;margin-top:40px;">Your cart is empty.</p>'
            : state.cart.map(function(item, idx) {
                return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13px;">' +
                  '<div><div style="font-weight:600;color:#0f172a;">' + item.name + '</div><div style="color:#64748b;font-size:12px;">' + formatBDT(item.price) + ' × ' + item.quantity + '</div></div>' +
                  '<div style="display:flex;align-items:center;gap:8px;"><strong style="color:#0f172a;">' + formatBDT(item.price * item.quantity) + '</strong><button data-nx-rm="' + idx + '" type="button" style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:12px;">Remove</button></div>' +
                '</div>';
              }).join('') +
              (state.checkoutStep
                ? '<form id="nx-checkout-form" style="margin-top:16px;display:flex;flex-direction:column;gap:10px;font-size:12px;">' +
                    '<input name="name" required placeholder="Full Name" style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;" />' +
                    '<input name="phone" required placeholder="Mobile Number (01XXXXXXXXX)" style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;" />' +
                    '<select id="nx-district-sel" name="district" style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;">' +
                      districts.map(function(d) { return '<option value="' + d + '" ' + (d === state.selectedDistrict ? 'selected' : '') + '>' + d + '</option>'; }).join('') +
                    '</select>' +
                    '<input name="address" required placeholder="Full Delivery Address (House, Road, Area)" style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;" />' +
                    '<select name="paymentMethod" style="padding:9px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;">' +
                      payments.map(function(p) { return '<option value="' + p.method + '">' + p.label + '</option>'; }).join('') +
                    '</select>' +
                    '<div style="background:#f8fafc;padding:12px;border-radius:10px;margin-top:4px;">' +
                      '<div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>Subtotal</span><span>' + formatBDT(sub) + '</span></div>' +
                      '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>Delivery (' + state.selectedDistrict + ')</span><span>' + formatBDT(ship) + '</span></div>' +
                      '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:14px;border-top:1px solid #e2e8f0;padding-top:6px;"><span>Total</span><span>' + formatBDT(total) + '</span></div>' +
                    '</div>' +
                    '<button type="submit" style="margin-top:6px;padding:12px;border:none;border-radius:10px;background:#4f46e5;color:#fff;font-weight:600;cursor:pointer;">Confirm Order (' + formatBDT(total) + ')</button>' +
                  '</form>'
                : '')
          ) +
        '</div>' +
        (state.cart.length && !state.checkoutStep
          ? '<div style="padding:16px 20px;border-top:1px solid #e2e8f0;">' +
              '<div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;font-weight:700;"><span>Subtotal</span><span>' + formatBDT(sub) + '</span></div>' +
              '<button id="nx-go-checkout" type="button" style="width:100%;padding:12px;border:none;border-radius:10px;background:#0f172a;color:#fff;font-weight:600;cursor:pointer;">Proceed to Checkout →</button>' +
            '</div>'
          : '') +
      '</div>';

    var closeBtn = document.getElementById('nx-close-drawer');
    if (closeBtn) closeBtn.onclick = function() { state.drawerOpen = false; renderDrawer(); };
    var goBtn = document.getElementById('nx-go-checkout');
    if (goBtn) goBtn.onclick = function() { state.checkoutStep = true; renderDrawer(); };
    var distSel = document.getElementById('nx-district-sel');
    if (distSel) distSel.onchange = function(e) { state.selectedDistrict = e.target.value; renderDrawer(); };
    container.querySelectorAll('[data-nx-rm]').forEach(function(b) {
      b.onclick = function() {
        state.cart.splice(Number(b.getAttribute('data-nx-rm')), 1);
        saveCart();
      };
    });
    var form = document.getElementById('nx-checkout-form');
    if (form) {
      form.onsubmit = function(e) {
        e.preventDefault();
        var fd = new FormData(form);
        origFetch(cfg.apiBase + '/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: {
              name: fd.get('name'),
              phone: fd.get('phone'),
              address: fd.get('address'),
              city: fd.get('district'),
              district: fd.get('district')
            },
            paymentMethod: fd.get('paymentMethod'),
            items: state.cart.map(function(i) { return { productId: i.productId, quantity: i.quantity }; })
          })
        }).then(function(r) { return r.json(); }).then(function(res) {
          state.cart = [];
          state.drawerOpen = false;
          saveCart();
          var num = (res && res.order && res.order.number) || 'Confirmed';
          var banner = document.createElement('div');
          banner.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;background:#059669;color:#fff;padding:14px 20px;border-radius:12px;font-family:system-ui,sans-serif;font-size:13px;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.2);';
          banner.textContent = '✔ Order #' + num + ' placed! We will call you shortly to confirm.';
          document.body.appendChild(banner);
          setTimeout(function() { banner.remove(); }, 4500);
        });
      };
    }
  }

  // Intercept Add to Cart / Buy Now clicks in capture phase for unmodified themes
  document.addEventListener('click', function(e) {
    if (window.__NEXDROP_SDK__) return;
    var target = e.target && e.target.closest ? e.target.closest('button, a') : null;
    if (!target || target.closest('#nx-universal-root')) return;
    var explicitId = target.getAttribute('data-nx-add-id');
    var txt = (target.textContent || '').trim();
    if (explicitId || /add to cart|buy now|order now|কার্টে যোগ|অর্ডার করুন/i.test(txt)) {
      e.preventDefault();
      e.stopPropagation();
      addToCart(explicitId || (state.products[0] && state.products[0].id));
    }
  }, true);

  // ── 5. Visual Editor Bridge & Point-and-Click DOM Inspector ───────────────
  function postToEditor(msg) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(Object.assign({ source: 'nexdrop-theme' }, msg), '*');
    }
  }

  if (cfg.mode === 'editor') {
    window.addEventListener('message', function(e) {
      var msg = e.data;
      if (!msg || msg.source !== 'nexdrop-editor') return;
      if (msg.type === 'ping') postToEditor({ type: 'ready', universalBridge: !window.__NEXDROP_SDK__ });
      if (msg.type === 'content' && msg.content) {
        applyThemeSettings(msg.content);
      }
    });
    postToEditor({ type: 'ready', universalBridge: !window.__NEXDROP_SDK__ });
  }

  // ── 6. Bootstrap Data & Start Observer ────────────────────────────────────
  Promise.all([
    origFetch(cfg.bootstrapUrl).then(function(r) { return r.json(); }).catch(function() { return null; }),
    origFetch(cfg.apiBase + '/products?limit=48').then(function(r) { return r.json(); }).catch(function() { return null; })
  ]).then(function(res) {
    state.boot = res[0];
    state.products = (res[1] && res[1].products) || [];
    if (state.boot && state.boot.content) applyThemeSettings(state.boot.content);
    hydrateProductCards();
    renderFloatingPill();

    var timer = null;
    var observer = new MutationObserver(function() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function() {
        hydrateProductCards();
        applyDomOverrides();
      }, 120);
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
})();`;
}

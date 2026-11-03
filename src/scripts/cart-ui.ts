/**
 * Interfaz del carrito: contador del header, cajón lateral, página /carrito
 * y envío del pedido a WhatsApp (vía /api/checkout).
 */
import { cart, cartCount, cartHasUnpriced, cartTotal, clearCart, setQty, type CartItem } from '@/stores/cart';
import type { Locale } from '@/lib/schemas';

type I18n = Record<'remove' | 'inc' | 'dec' | 'tbd' | 'photo' | 'sending' | 'send' | 'error' | 'nameRequired' | 'productBase', string>;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const money = (n: number, locale: Locale) =>
  new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-EC', { style: 'currency', currency: 'USD' }).format(n);
const pick = (v: { es: string; en: string }, l: Locale) => v[l] || v.es;

const PH = '<svg viewBox="0 0 120 60" fill="none" aria-hidden="true"><path d="M6 56 44 22l16 13"/><path d="M40 40 70 6l44 50"/></svg>';
const ICON_MINUS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>';
const ICON_PLUS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

function itemHtml(item: CartItem, locale: Locale, i18n: I18n) {
  const name = esc(pick(item.name, locale));
  const href = i18n.productBase.replace('__slug__', encodeURIComponent(item.slug));
  const vars = item.labels.map((l) => `${esc(pick(l.name, locale))}: ${esc(pick(l.value, locale))}`).join(' · ');
  const img = item.image
    ? `<img class="cp-item__img" src="${esc(item.image)}" alt="" width="80" height="100" loading="lazy" />`
    : `<div class="cp-item__img cp-item__ph" role="img" aria-label="${esc(i18n.photo)}">${PH}</div>`;
  const price =
    item.unitPrice > 0
      ? `<span class="cp-item__price">${money(item.unitPrice * item.qty, locale)}</span>`
      : `<span class="cp-item__price cp-item__price--tbd">${esc(i18n.tbd)}</span>`;
  return `<li class="cp-item" data-key="${esc(item.key)}">
    ${img}
    <div>
      <a class="cp-item__name" href="${href}">${name}</a>
      ${vars ? `<p class="cp-item__vars">${vars}</p>` : ''}
      <div class="cp-item__row">
        <div class="stepper">
          <button type="button" data-dec aria-label="${esc(i18n.dec)}" ${item.qty <= 1 ? 'disabled' : ''}>${ICON_MINUS}</button>
          <output aria-live="polite">${item.qty}</output>
          <button type="button" data-inc aria-label="${esc(i18n.inc)}" ${item.qty >= 99 ? 'disabled' : ''}>${ICON_PLUS}</button>
        </div>
        <button type="button" class="cp-item__remove" data-remove>${esc(i18n.remove)}</button>
      </div>
    </div>
    ${price}
  </li>`;
}

function renderPanel(panel: HTMLElement) {
  const locale = (panel.dataset.locale as Locale) || 'es';
  const i18n = JSON.parse(panel.dataset.i18n || '{}') as I18n;
  const items = cart.get();
  const list = panel.querySelector<HTMLElement>('[data-cart-list]')!;
  panel.querySelector<HTMLElement>('[data-cart-empty]')!.hidden = items.length > 0;
  panel.querySelector<HTMLElement>('[data-cart-summary]')!.hidden = items.length === 0;
  list.innerHTML = items.map((i) => itemHtml(i, locale, i18n)).join('');
  const total = cartTotal.get();
  panel.querySelector<HTMLElement>('[data-cart-total]')!.textContent =
    total > 0 ? money(total, locale) + (cartHasUnpriced.get() ? ' +' : '') : i18n.tbd;
  panel.querySelector<HTMLElement>('[data-cart-unpriced]')!.hidden = !cartHasUnpriced.get();
}

function bindPanel(panel: HTMLElement) {
  panel.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const row = target.closest<HTMLElement>('[data-key]');
    if (!row) return;
    const key = row.dataset.key!;
    const item = cart.get().find((i) => i.key === key);
    if (!item) return;
    if (target.closest('[data-inc]')) setQty(key, item.qty + 1);
    else if (target.closest('[data-dec]')) setQty(key, item.qty - 1);
    else if (target.closest('[data-remove]')) setQty(key, 0);
  });

  const form = panel.querySelector<HTMLFormElement>('[data-checkout-form]');
  if (!form) return;
  const i18n = JSON.parse(panel.dataset.i18n || '{}') as I18n;
  const locale = (panel.dataset.locale as Locale) || 'es';
  const errorEl = form.querySelector<HTMLElement>('[data-checkout-error]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-checkout-submit]')!;
  const label = submit.querySelector('span')!;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    if (!name) {
      errorEl.textContent = i18n.nameRequired;
      errorEl.hidden = false;
      form.querySelector<HTMLInputElement>('[name="name"]')?.focus();
      return;
    }
    submit.disabled = true;
    label.textContent = i18n.sending;
    // Abrimos la pestaña antes del await para que el navegador no la bloquee.
    const isMobile = matchMedia('(pointer: coarse)').matches;
    const win = isMobile ? null : window.open('', '_blank');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locale,
          customer: { name, city: String(data.get('city') || ''), note: String(data.get('note') || '') },
          items: cart.get().map((i) => ({ productId: i.productId, qty: i.qty, selections: i.selections })),
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { whatsappUrl } = (await res.json()) as { whatsappUrl: string };
      clearCart();
      form.reset();
      if (win) {
        win.location.href = whatsappUrl;
        closeDrawer();
      } else {
        window.location.href = whatsappUrl;
      }
    } catch {
      win?.close();
      errorEl.textContent = i18n.error;
      errorEl.hidden = false;
    } finally {
      submit.disabled = false;
      label.textContent = i18n.send;
    }
  });
}

/* ─── Cajón ───────────────────────────────── */
let lastFocus: HTMLElement | null = null;

function openDrawer() {
  const d = document.querySelector<HTMLElement>('[data-cart-drawer]');
  if (!d) return;
  lastFocus = document.activeElement as HTMLElement;
  d.hidden = false;
  requestAnimationFrame(() => d.classList.add('is-open'));
  document.documentElement.style.overflow = 'hidden';
  window.dispatchEvent(new CustomEvent('alpez:scroll-lock', { detail: true }));
  d.querySelector<HTMLElement>('.drawer__close')?.focus();
}

function closeDrawer() {
  const d = document.querySelector<HTMLElement>('[data-cart-drawer]');
  if (!d || d.hidden) return;
  d.classList.remove('is-open');
  document.documentElement.style.overflow = '';
  window.dispatchEvent(new CustomEvent('alpez:scroll-lock', { detail: false }));
  setTimeout(() => (d.hidden = true), 450);
  lastFocus?.focus();
}

function trapFocus(e: KeyboardEvent) {
  const d = document.querySelector<HTMLElement>('[data-cart-drawer]');
  if (!d || d.hidden) return;
  if (e.key === 'Escape') return closeDrawer();
  if (e.key !== 'Tab') return;
  const f = [...d.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select')].filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0]!;
  const last = f[f.length - 1]!;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* ─── Ciclo de vida con View Transitions ───── */
let unsub: (() => void) | null = null;
let lastCount = -1;

function renderAll() {
  document.querySelectorAll<HTMLElement>('[data-cart-panel]').forEach(renderPanel);
  const n = cartCount.get();
  document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach((el) => {
    el.textContent = String(n);
    el.classList.toggle('has-items', n > 0);
    if (lastCount >= 0 && n > lastCount) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  });
  lastCount = n;
}

function init() {
  unsub?.();
  document.querySelectorAll<HTMLElement>('[data-cart-panel]').forEach(bindPanel);
  document.querySelectorAll('[data-cart-open]').forEach((b) => b.addEventListener('click', openDrawer));
  document.querySelectorAll('[data-cart-close], [data-cart-close-link]').forEach((b) => b.addEventListener('click', closeDrawer));
  unsub = cart.subscribe(renderAll);
}

document.addEventListener('keydown', trapFocus);
document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', () => {
  document.documentElement.style.overflow = '';
});
window.addEventListener('alpez:open-cart', openDrawer);

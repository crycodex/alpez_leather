/** Estadísticas ligeras y anónimas → /api/track (sin cookies, sin terceros). */
type EventType = 'page_view' | 'product_view' | 'add_to_cart';

export function track(type: EventType, productId?: string) {
  if (navigator.webdriver) return;
  const body = JSON.stringify({ type, productId, path: location.pathname, locale: document.documentElement.lang });
  const blob = new Blob([body], { type: 'application/json' });
  if (!navigator.sendBeacon?.('/api/track', blob)) {
    fetch('/api/track', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
  }
}

document.addEventListener('astro:page-load', () => {
  track('page_view');
  const pid = document.body.dataset.productId;
  if (pid) track('product_view', pid);
});

window.addEventListener('alpez:added', (e) => track('add_to_cart', (e as CustomEvent<string>).detail));

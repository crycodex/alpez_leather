export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

/** Límite de peticiones best-effort por instancia (protege contra abuso simple). */
const hits = new Map<string, { n: number; at: number }>();
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.at > windowMs) {
    hits.set(key, { n: 1, at: now });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  h.n++;
  return h.n > max;
}

export const clientIp = (request: Request, fallback = 'anon') =>
  request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || fallback;

/** Fecha local de Ecuador (UTC-5) en formato YYYY-MM-DD */
export function ecuadorDate(d = new Date()) {
  return new Date(d.getTime() - 5 * 3600_000).toISOString().slice(0, 10);
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

import { useMemo, useState } from 'react';
import type { Category, Product, StatsDay } from '@/lib/schemas';
import { useCollection, useOrders, useStats } from './data';
import { Badge, Button, Empty, Loading, PageHead, Panel, fmtDate, fmtMoney, fmtNum } from './ui';
import { STATUS_LABEL, STATUS_TONE } from './Orders';
import { go } from './AdminApp';

const RANGES = [7, 30, 90] as const;
const sum = (rows: StatsDay[], k: keyof StatsDay) => rows.reduce((n, r) => n + (Number(r[k]) || 0), 0);
const mergeMaps = (rows: StatsDay[], k: 'views' | 'carts' | 'ordered') => {
  const out: Record<string, number> = {};
  rows.forEach((r) => Object.entries(r[k] ?? {}).forEach(([id, n]) => (out[id] = (out[id] ?? 0) + n)));
  return out;
};
const shortDate = (iso: string) => new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`));

export default function Dashboard() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const { data } = useStats(days);
  const { items: products } = useCollection<Product>('products');
  const { items: categories } = useCollection<Category>('categories');
  const orders = useOrders(8);

  return (
    <>
      <PageHead
        title="Resumen"
        description="Visitas, interés por producto y pedidos enviados por WhatsApp. Las cifras son anónimas y excluyen robots."
        actions={
          <div className="a-seg" role="group" aria-label="Periodo">
            {RANGES.map((r) => (
              <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}>
                {r} días
              </button>
            ))}
          </div>
        }
      />
      {!data || !products || !categories ? <Loading /> : <Stats rows={data} products={products} categories={categories} days={days} />}
      <div className="a-dash-grid">
        <Panel title="Últimos pedidos" actions={<Button variant="ghost" onClick={() => go('pedidos')}>Ver todos</Button>}>
          {!orders ? (
            <Loading />
          ) : orders.length === 0 ? (
            <Empty title="Aún no hay pedidos" />
          ) : (
            <ul role="list" className="a-mini-orders">
              {orders.map((o) => (
                <li key={o.id}>
                  <div>
                    <strong className="num">#{o.code}</strong> · {o.customer.name}
                    <div className="a-muted">{fmtDate(o.createdAt)}</div>
                  </div>
                  <div className="a-mini-orders__right">
                    <span className="num">{fmtMoney(o.total)}</span>
                    <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        {products && categories && <PendingChecklist products={products} categories={categories} />}
      </div>
    </>
  );
}

function Stats({ rows, products, categories, days }: { rows: StatsDay[]; products: Product[]; categories: Category[]; days: number }) {
  const t = useMemo(() => {
    const pageViews = sum(rows, 'pageViews');
    const productViews = sum(rows, 'productViews');
    const addToCart = sum(rows, 'addToCart');
    const checkouts = sum(rows, 'checkouts');
    const revenue = sum(rows, 'revenue');
    return { pageViews, productViews, addToCart, checkouts, revenue };
  }, [rows]);
  const name = (id: string) => products.find((p) => p.id === id)?.name?.es ?? '(eliminado)';
  const top = (k: 'views' | 'ordered') =>
    Object.entries(mergeMaps(rows, k))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id, n]) => ({ label: name(id), value: n }));
  const byCategory = (() => {
    const views = mergeMaps(rows, 'views');
    const out = new Map<string, number>();
    for (const [id, n] of Object.entries(views)) {
      const cat = products.find((p) => p.id === id)?.categoryId;
      const label = categories.find((c) => c.id === cat)?.name.es ?? 'Sin categoría';
      out.set(label, (out.get(label) ?? 0) + n);
    }
    return [...out.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  })();

  if (t.pageViews === 0 && t.checkouts === 0)
    return (
      <Panel>
        <Empty title={`Sin visitas registradas en los últimos ${days} días`}>
          <p className="a-field__help">Las estadísticas empiezan a contarse cuando el sitio está publicado y conectado a Firebase.</p>
        </Empty>
      </Panel>
    );

  return (
    <>
      <div className="a-kpis">
        <Kpi label="Visitas" value={fmtNum(t.pageViews)} />
        <Kpi label="Vistas de producto" value={fmtNum(t.productViews)} />
        <Kpi label="Agregados al carrito" value={fmtNum(t.addToCart)} />
        <Kpi label="Pedidos por WhatsApp" value={fmtNum(t.checkouts)} />
        <Kpi label="Valor de pedidos" value={fmtMoney(t.revenue)} note="Estimado; sin precios por confirmar" />
      </div>
      <div className="a-dash-grid">
        <Panel title="Visitas por día">
          <Bars rows={rows.map((r) => ({ label: shortDate(r.date), value: r.pageViews ?? 0 }))} unit="visitas" />
        </Panel>
        <Panel title="Pedidos por día">
          <Bars rows={rows.map((r) => ({ label: shortDate(r.date), value: r.checkouts ?? 0 }))} unit="pedidos" />
        </Panel>
        <Panel title="Embudo de compra">
          <Funnel
            steps={[
              { label: 'Vieron un producto', value: t.productViews },
              { label: 'Agregaron al carrito', value: t.addToCart },
              { label: 'Enviaron pedido', value: t.checkouts },
            ]}
          />
        </Panel>
        <Panel title="Interés por categoría">
          <HBars rows={byCategory} empty="Sin vistas de producto aún" />
        </Panel>
        <Panel title="Productos más vistos">
          <HBars rows={top('views')} empty="Sin vistas de producto aún" />
        </Panel>
        <Panel title="Productos más pedidos (unidades)">
          <HBars rows={top('ordered')} empty="Sin pedidos aún" />
        </Panel>
      </div>
    </>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="a-kpi">
      <span className="a-kpi__label">{label}</span>
      <strong className="a-kpi__value num">{value}</strong>
      {note && <span className="a-kpi__note">{note}</span>}
    </div>
  );
}

/** Barras verticales (una sola serie) con tooltip y tabla accesible. */
function Bars({ rows, unit }: { rows: { label: string; value: number }[]; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 200;
  const pad = { t: 12, r: 8, b: 26, l: 36 };
  const max = Math.max(1, ...rows.map((r) => r.value));
  const nice = Math.ceil(max / 4) * 4 || 4;
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const bw = iw / rows.length;
  const ticks = [0, nice / 2, nice];
  const every = Math.ceil(rows.length / 7);
  const h = hover !== null ? rows[hover] : null;
  return (
    <div className="a-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${unit} por día`} onMouseLeave={() => setHover(null)}>
        {ticks.map((tk) => {
          const y = pad.t + ih - (tk / nice) * ih;
          return (
            <g key={tk}>
              <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} className="a-chart__grid" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" className="a-chart__axis">{fmtNum(tk)}</text>
            </g>
          );
        })}
        {rows.map((r, i) => {
          const bh = (r.value / nice) * ih;
          const x = pad.l + i * bw;
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={x} y={pad.t} width={bw} height={ih} fill="transparent" />
              <rect x={x + bw * 0.18} y={pad.t + ih - bh} width={Math.max(1, bw * 0.64)} height={bh} rx={Math.min(3, bw * 0.2)} className={`a-chart__bar ${hover === i ? 'is-hover' : ''}`} />
              {i % every === 0 && (
                <text x={x + bw / 2} y={H - 6} textAnchor="middle" className="a-chart__axis">{r.label}</text>
              )}
            </g>
          );
        })}
      </svg>
      {h && hover !== null && (
        <div className="a-tip" style={{ left: `${((pad.l + (hover + 0.5) * bw) / W) * 100}%` }}>
          <span>{h.label}</span>
          <strong className="num">{fmtNum(h.value)} {unit}</strong>
        </div>
      )}
      <details className="a-chart__table">
        <summary>Ver como tabla</summary>
        <table className="a-table a-table--compact">
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}><td>{r.label}</td><td className="num">{fmtNum(r.value)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

/** Barras horizontales con etiqueta y valor directos. */
function HBars({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  if (!rows.length) return <p className="a-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul role="list" className="a-hbars">
      {rows.map((r) => (
        <li key={r.label} title={`${r.label}: ${fmtNum(r.value)}`}>
          <span className="a-hbars__label">{r.label}</span>
          <span className="a-hbars__track"><span className="a-hbars__bar" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="a-hbars__value num">{fmtNum(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const first = steps[0]?.value || 0;
  return (
    <ol className="a-funnel">
      {steps.map((s, i) => {
        const pct = first ? (s.value / first) * 100 : 0;
        const prev = i > 0 ? steps[i - 1]!.value : 0;
        return (
          <li key={s.label}>
            <div className="a-funnel__head">
              <span>{s.label}</span>
              <strong className="num">{fmtNum(s.value)}</strong>
            </div>
            <span className="a-hbars__track"><span className="a-hbars__bar" style={{ width: `${first ? Math.max(pct, s.value ? 2 : 0) : 0}%` }} /></span>
            {i > 0 && <span className="a-muted num">{prev ? `${Math.round((s.value / prev) * 100)}% del paso anterior` : '—'}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function PendingChecklist({ products, categories }: { products: Product[]; categories: Category[] }) {
  const noPhoto = products.filter((p) => p.active && !p.images?.length);
  const noPrice = products.filter((p) => p.active && !(p.price > 0));
  const noEn = products.filter((p) => p.active && !p.name?.en);
  const pending = products.filter((p) => p.pending);
  const catPending = categories.filter((c) => c.pending);
  const items = [
    { n: noPhoto.length, text: 'productos visibles sin foto', to: 'productos' },
    { n: noPrice.length, text: 'productos con precio por confirmar', to: 'productos' },
    { n: noEn.length, text: 'productos sin nombre en inglés', to: 'productos' },
    { n: pending.length, text: 'productos marcados como pendientes', to: 'productos' },
    { n: catPending.length, text: 'categorías pendientes', to: 'categorias' },
  ].filter((i) => i.n > 0);
  return (
    <Panel title="Pendientes">
      {items.length === 0 ? (
        <p>Todo al día: no hay pendientes.</p>
      ) : (
        <ul role="list" className="a-checklist">
          {items.map((i) => (
            <li key={i.text}>
              <a href={`#/${i.to}`}>
                <strong className="num">{i.n}</strong> {i.text}
              </a>
            </li>
          ))}
          <li>
            <a href="#/contenido">Revisa los textos marcados «Pendiente» en Textos y fotos</a>
          </li>
        </ul>
      )}
    </Panel>
  );
}

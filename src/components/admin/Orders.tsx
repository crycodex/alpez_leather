import { useMemo, useState } from 'react';
import { ORDER_STATUS, type Order, type OrderStatus } from '@/lib/schemas';
import { setOrderStatus, useOrders } from './data';
import { Badge, Empty, Loading, PageHead, fmtDate, fmtMoney, useToast } from './ui';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};
export const STATUS_TONE: Record<OrderStatus, 'pending' | 'brass' | 'ok' | 'off'> = {
  pending: 'pending',
  confirmed: 'brass',
  delivered: 'ok',
  cancelled: 'off',
};

export default function Orders() {
  const orders = useOrders(300);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const toast = useToast();
  const list = useMemo(() => (orders ?? []).filter((o) => filter === 'all' || o.status === filter), [orders, filter]);
  if (!orders) return <Loading />;

  return (
    <>
      <PageHead
        title="Pedidos"
        description="Cada vez que un cliente envía su carrito por WhatsApp queda registrado aquí. Actualiza el estado cuando lo confirmes o entregues."
      />
      <div className="a-tabs" role="tablist">
        {(['all', ...ORDER_STATUS] as const).map((s) => (
          <button key={s} type="button" role="tab" aria-selected={filter === s} onClick={() => setFilter(s)}>
            {s === 'all' ? 'Todos' : STATUS_LABEL[s]}{' '}
            <span className="a-tabs__n num">{s === 'all' ? orders.length : orders.filter((o) => o.status === s).length}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty title={orders.length ? 'No hay pedidos con este estado' : 'Aún no hay pedidos'}>
          {!orders.length && <p className="a-field__help">Aparecerán cuando un cliente use «Enviar por WhatsApp».</p>}
        </Empty>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th scope="col">Pedido</th>
                <th scope="col">Cliente</th>
                <th scope="col">Fecha</th>
                <th scope="col" className="num">Total</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  open={open === o.id}
                  onToggle={() => setOpen(open === o.id ? null : o.id)}
                  onStatus={async (s) => {
                    await setOrderStatus(o.id, s);
                    toast(`Pedido #${o.code}: ${STATUS_LABEL[s]}`);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function OrderRow({ order: o, open, onToggle, onStatus }: { order: Order; open: boolean; onToggle: () => void; onStatus: (s: OrderStatus) => void }) {
  const items = o.lines.reduce((n, l) => n + l.qty, 0);
  return (
    <>
      <tr className="is-clickable" onClick={onToggle}>
        <td>
          <button type="button" className="a-link num" aria-expanded={open} onClick={(e) => (e.stopPropagation(), onToggle())}>
            #{o.code}
          </button>
          <div className="a-muted">{items} pieza{items === 1 ? '' : 's'} · {o.locale.toUpperCase()}</div>
        </td>
        <td>
          {o.customer.name}
          {o.customer.city && <div className="a-muted">{o.customer.city}</div>}
        </td>
        <td>{fmtDate(o.createdAt)}</td>
        <td className="num">
          {fmtMoney(o.total)}
          {o.hasUnpricedItems && <div className="a-muted">+ por confirmar</div>}
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          <label className="sr-only" htmlFor={`st-${o.id}`}>Estado</label>
          <select id={`st-${o.id}`} className={`a-input a-select a-status a-status--${STATUS_TONE[o.status]}`} value={o.status} onChange={(e) => onStatus(e.target.value as OrderStatus)}>
            {ORDER_STATUS.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </td>
      </tr>
      {open && (
        <tr className="a-order-detail">
          <td colSpan={5}>
            <ul role="list">
              {o.lines.map((l, i) => (
                <li key={i}>
                  <span>
                    <strong>{l.name}</strong>
                    {l.variants && <span className="a-muted"> · {l.variants}</span>}
                  </span>
                  <span className="num">
                    {l.qty} × {l.unitPrice > 0 ? fmtMoney(l.unitPrice) : 'por confirmar'}
                  </span>
                </li>
              ))}
            </ul>
            {o.customer.note && (
              <p>
                <strong>Nota:</strong> {o.customer.note}
              </p>
            )}
            <Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
          </td>
        </tr>
      )}
    </>
  );
}

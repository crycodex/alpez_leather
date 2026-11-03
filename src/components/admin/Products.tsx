import { useEffect, useMemo, useState } from 'react';
import { Product, STOCK_STATUS, type Category, type Variant } from '@/lib/schemas';
import { deleteImage, newId, removeDoc, slugify, useCollection, writeDoc } from './data';
import { ImagesField } from './ImageUploader';
import { Badge, Button, Empty, Icon, L10nInput, Loading, PageHead, Panel, Select, TextInput, Toggle, fmtMoney, useToast } from './ui';
import { go } from './AdminApp';

const STOCK_LABEL: Record<(typeof STOCK_STATUS)[number], string> = {
  available: 'Disponible',
  made_to_order: 'Bajo pedido',
  sold_out: 'Agotado',
};

export default function Products({ param }: { param?: string }) {
  const { items: products, error } = useCollection<Product>('products');
  const { items: categories } = useCollection<Category>('categories');
  if (error) return <p className="a-error">No se pudieron cargar los productos: {error}</p>;
  if (!products || !categories) return <Loading />;
  if (param) {
    const existing = products.find((p) => p.id === param);
    if (param !== 'nuevo' && !existing) return <Empty title="Este producto ya no existe"><Button onClick={() => go('productos')}>Volver</Button></Empty>;
    return <ProductEditor key={param} initial={existing} categories={categories} allProducts={products} />;
  }
  return <ProductList products={products} categories={categories} />;
}

function ProductList({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'hidden' | 'pending'>('all');
  const catName = new Map(categories.map((c) => [c.id, c.name.es]));
  const list = useMemo(
    () =>
      [...products]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .filter((p) => !q || `${p.name?.es} ${p.name?.en} ${p.slug}`.toLowerCase().includes(q.toLowerCase()))
        .filter((p) => !cat || p.categoryId === cat)
        .filter((p) => status === 'all' || (status === 'active' ? p.active : status === 'hidden' ? !p.active : p.pending)),
    [products, q, cat, status],
  );
  return (
    <>
      <PageHead
        title="Productos"
        description={`${products.length} en total · ${products.filter((p) => p.active).length} visibles en la tienda`}
        actions={<Button icon="plus" onClick={() => go('productos/nuevo')}>Nuevo producto</Button>}
      />
      <div className="a-filters">
        <label className="a-search">
          <Icon name="search" />
          <span className="sr-only">Buscar</span>
          <input className="a-input" placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select className="a-input a-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name.es}</option>)}
        </select>
        <select className="a-input a-select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Estado">
          <option value="all">Todos</option>
          <option value="active">Visibles</option>
          <option value="hidden">Ocultos</option>
          <option value="pending">Pendientes</option>
        </select>
      </div>
      {list.length === 0 ? (
        <Empty title={products.length ? 'Ningún producto coincide con el filtro' : 'Aún no hay productos'}>
          {!products.length && <Button icon="plus" onClick={() => go('productos/nuevo')}>Crear el primero</Button>}
        </Empty>
      ) : (
        <div className="a-table-wrap">
          <table className="a-table">
            <thead>
              <tr>
                <th scope="col">Producto</th>
                <th scope="col">Categoría</th>
                <th scope="col" className="num">Precio</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} onClick={() => go(`productos/${p.id}`)} className="is-clickable">
                  <td>
                    <a href={`#/productos/${p.id}`} className="a-prod-cell" onClick={(e) => e.stopPropagation()}>
                      {p.images?.[0]?.url ? <img src={p.images[0].url} alt="" /> : <span className="a-thumb-ph" aria-hidden="true" />}
                      <span>
                        <strong>{p.name?.es || '(sin nombre)'}</strong>
                        {p.featured && <Badge tone="brass">Destacado</Badge>}
                      </span>
                    </a>
                  </td>
                  <td>{catName.get(p.categoryId) ?? <span className="a-muted">—</span>}</td>
                  <td className="num">{p.price > 0 ? fmtMoney(p.price) : <span className="a-muted">Por confirmar</span>}</td>
                  <td>
                    <div className="a-badges">
                    {p.active ? <Badge tone="ok">Visible</Badge> : <Badge tone="off">Oculto</Badge>}
                    {p.pending && <Badge tone="pending">Pendiente</Badge>}
                    {p.stockStatus !== 'available' && <Badge>{STOCK_LABEL[p.stockStatus]}</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const blank = (order: number, categoryId: string): Product => ({
  id: '',
  slug: '',
  categoryId,
  name: { es: '', en: '' },
  description: { es: '', en: '' },
  details: { es: 'Material: \nMedidas: \nCuidados: ', en: 'Material: \nSize: \nCare: ' },
  price: 0,
  compareAtPrice: null,
  images: [],
  variants: [],
  featured: false,
  active: true,
  stockStatus: 'available',
  order,
  pending: false,
});

function ProductEditor({ initial, categories, allProducts }: { initial?: Product; categories: Category[]; allProducts: Product[] }) {
  const isNew = !initial;
  const [id] = useState(() => initial?.id ?? newId('products'));
  const [p, setP] = useState<Product>(() => ({ ...blank(allProducts.length + 1, categories[0]?.id ?? ''), ...initial }));
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const toast = useToast();

  const set = <K extends keyof Product>(k: K, v: Product[K]) => {
    setP((x) => ({ ...x, [k]: v }));
    setDirty(true);
  };
  useEffect(() => {
    if (!slugTouched) setP((x) => ({ ...x, slug: slugify(x.name.es) }));
  }, [p.name.es, slugTouched]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => dirty && e.preventDefault();
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirty]);

  const slugTaken = allProducts.some((x) => x.slug === p.slug && x.id !== id);

  const save = async () => {
    if (!p.name.es.trim()) return toast('Escribe el nombre en español.', 'error');
    if (!p.slug) return toast('Falta la dirección web (slug).', 'error');
    if (slugTaken) return toast('Ya existe otro producto con esa dirección web.', 'error');
    const parsed = Product.safeParse({ ...p, id, updatedAt: Date.now(), createdAt: p.createdAt ?? Date.now() });
    if (!parsed.success) return toast(`Revisa los campos: ${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message}`, 'error');
    setSaving(true);
    try {
      const { id: _omit, ...data } = parsed.data;
      await writeDoc(`products/${id}`, data);
      setDirty(false);
      toast('Producto guardado. Pulsa «Publicar cambios» para verlo al instante.');
      if (isNew) go(`productos/${id}`);
    } catch (err) {
      toast(`No se pudo guardar: ${(err as Error).message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar «${p.name.es}» y sus fotos? No se puede deshacer.`)) return;
    await Promise.all(p.images.map(deleteImage));
    await removeDoc(`products/${id}`);
    toast('Producto eliminado.');
    go('productos');
  };

  return (
    <>
      <PageHead
        title={isNew ? 'Nuevo producto' : p.name.es || 'Producto'}
        description={<a href="#/productos" className="a-back"><Icon name="left" size={16} /> Todos los productos</a>}
        actions={
          <>
            {!isNew && (
              <a className="a-btn a-btn--ghost" href={`/producto/${p.slug}`} target="_blank" rel="noopener">
                <Icon name="external" size={16} /> <span>Ver</span>
              </a>
            )}
            <Button onClick={save} busy={saving}>{saving ? 'Guardando…' : dirty || isNew ? 'Guardar' : 'Guardado'}</Button>
          </>
        }
      />

      <div className="a-editor">
        <div className="a-editor__main">
          <Panel title="Información">
            <L10nInput label="Nombre" value={p.name} onChange={(v) => set('name', v)} />
            <L10nInput label="Descripción" value={p.description} onChange={(v) => set('description', v)} multiline={4} help="Estilo, uso y lo que hace especial a la pieza." />
            <L10nInput
              label="Detalles"
              value={p.details}
              onChange={(v) => set('details', v)}
              multiline={5}
              help={<>Una línea por dato, con el formato <code>Etiqueta: valor</code>. Ej.: <code>Medidas: 30 × 20 × 10 cm</code>.</>}
            />
          </Panel>

          <Panel title="Fotos">
            <ImagesField label="Galería" value={p.images} onChange={(v) => set('images', v)} folder={`products/${id}`} />
          </Panel>

          <Panel title="Variantes" actions={<Button variant="ghost" icon="plus" onClick={() => set('variants', [...p.variants, { id: `v${Date.now().toString(36)}`, name: { es: '', en: '' }, options: [] }])}>Añadir variante</Button>}>
            <p className="a-field__help">Opcional. Ej.: «Color» con Miel, Chocolate, Negro; o «Talla» con S, M, L. El cliente elige antes de agregar al carrito.</p>
            {p.variants.map((v, vi) => (
              <VariantEditor
                key={v.id}
                variant={v}
                onChange={(nv) => set('variants', p.variants.map((x, i) => (i === vi ? nv : x)))}
                onRemove={() => set('variants', p.variants.filter((_, i) => i !== vi))}
              />
            ))}
          </Panel>
        </div>

        <div className="a-editor__side">
          <Panel title="Publicación">
            <Toggle label="Visible en la tienda" checked={p.active} onChange={(v) => set('active', v)} />
            <Toggle label="Destacado en inicio" checked={p.featured} onChange={(v) => set('featured', v)} />
            <Toggle label="Marcar como pendiente" checked={p.pending} onChange={(v) => set('pending', v)} help="Muestra la etiqueta «Pendiente» mientras completas fotos o textos." />
          </Panel>
          <Panel title="Precio y stock">
            <TextInput label="Precio (USD)" type="number" min={0} step="0.01" value={p.price || ''} onChange={(v) => set('price', Math.max(0, Number(v) || 0))} help="Déjalo en 0 para mostrar «Precio por confirmar»." />
            <TextInput label="Precio anterior (opcional)" type="number" min={0} step="0.01" value={p.compareAtPrice ?? ''} onChange={(v) => set('compareAtPrice', v ? Math.max(0, Number(v)) : null)} help="Aparece tachado si es mayor al precio." />
            <Select label="Disponibilidad" value={p.stockStatus} onChange={(v) => set('stockStatus', v)} options={STOCK_STATUS.map((s) => ({ value: s, label: STOCK_LABEL[s] }))} />
          </Panel>
          <Panel title="Organización">
            <Select label="Categoría" value={p.categoryId} onChange={(v) => set('categoryId', v)} options={[{ value: '', label: 'Sin categoría' }, ...categories.map((c) => ({ value: c.id, label: c.name.es }))]} />
            <TextInput label="Orden" type="number" value={p.order} onChange={(v) => set('order', Number(v) || 0)} help="Menor número = aparece primero." />
            <TextInput
              label="Dirección web (slug)"
              value={p.slug}
              onChange={(v) => {
                setSlugTouched(true);
                set('slug', slugify(v));
              }}
              help={slugTaken ? <span className="a-error">Ya existe otro producto con esta dirección.</span> : <>alpezleather.com/producto/<strong>{p.slug || '…'}</strong></>}
            />
          </Panel>
          {!isNew && (
            <Panel>
              <Button variant="danger" icon="trash" onClick={remove}>Eliminar producto</Button>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function VariantEditor({ variant, onChange, onRemove }: { variant: Variant; onChange: (v: Variant) => void; onRemove: () => void }) {
  const setOpt = (i: number, patch: Partial<Variant['options'][number]>) => onChange({ ...variant, options: variant.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) });
  return (
    <div className="a-variant">
      <div className="a-variant__head">
        <L10nInput label="Nombre de la variante" value={variant.name} onChange={(name) => onChange({ ...variant, name })} />
        <Button variant="quiet" icon="trash" onClick={() => confirm('¿Quitar esta variante?') && onRemove()} aria-label="Quitar variante" />
      </div>
      <table className="a-table a-table--compact">
        <thead>
          <tr>
            <th scope="col">Opción (ES)</th>
            <th scope="col">Option (EN)</th>
            <th scope="col">+ Precio</th>
            <th scope="col">Disponible</th>
            <th scope="col"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {variant.options.map((o, i) => (
            <tr key={o.id}>
              <td><input className="a-input" aria-label="Opción en español" value={o.label.es} onChange={(e) => setOpt(i, { label: { ...o.label, es: e.target.value } })} /></td>
              <td><input className="a-input" aria-label="Opción en inglés" value={o.label.en} onChange={(e) => setOpt(i, { label: { ...o.label, en: e.target.value } })} /></td>
              <td><input className="a-input num" aria-label="Diferencia de precio" type="number" step="0.01" value={o.priceDelta || ''} onChange={(e) => setOpt(i, { priceDelta: Number(e.target.value) || 0 })} /></td>
              <td><input type="checkbox" aria-label="Disponible" checked={o.available} onChange={(e) => setOpt(i, { available: e.target.checked })} /></td>
              <td>
                <Button variant="quiet" icon="trash" aria-label="Quitar opción" onClick={() => onChange({ ...variant, options: variant.options.filter((_, j) => j !== i) })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        variant="ghost"
        icon="plus"
        onClick={() => onChange({ ...variant, options: [...variant.options, { id: `o${Date.now().toString(36)}`, label: { es: '', en: '' }, priceDelta: 0, available: true }] })}
      >
        Añadir opción
      </Button>
    </div>
  );
}

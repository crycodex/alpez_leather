import { useState } from 'react';
import { Category, type Product } from '@/lib/schemas';
import { deleteImage, removeDoc, slugify, useCollection, writeDoc } from './data';
import { ImageField } from './ImageUploader';
import { Badge, Button, Empty, Icon, L10nInput, Loading, PageHead, Panel, TextInput, Toggle, useToast } from './ui';

export default function Categories() {
  const { items: categories } = useCollection<Category>('categories');
  const { items: products } = useCollection<Product>('products');
  const [editing, setEditing] = useState<string | null>(null);
  if (!categories || !products) return <Loading />;
  const sorted = [...categories].sort((a, b) => a.order - b.order);
  const count = (id: string) => products.filter((p) => p.categoryId === id).length;

  const move = async (i: number, dir: -1 | 1) => {
    const a = sorted[i];
    const b = sorted[i + dir];
    if (!a || !b) return;
    await Promise.all([writeDoc(`categories/${a.id}`, { ...strip(a), order: b.order }), writeDoc(`categories/${b.id}`, { ...strip(b), order: a.order })]);
  };

  return (
    <>
      <PageHead
        title="Categorías"
        description="Organizan la tienda y el menú. Ordénalas con las flechas."
        actions={<Button icon="plus" onClick={() => setEditing('nueva')}>Nueva categoría</Button>}
      />
      {editing === 'nueva' && <CategoryEditor all={categories} onDone={() => setEditing(null)} order={(sorted.at(-1)?.order ?? 0) + 1} />}
      {sorted.length === 0 && editing !== 'nueva' ? (
        <Empty title="Aún no hay categorías" />
      ) : (
        <ul role="list" className="a-cat-list">
          {sorted.map((c, i) => (
            <li key={c.id}>
              {editing === c.id ? (
                <CategoryEditor initial={c} all={categories} onDone={() => setEditing(null)} order={c.order} productCount={count(c.id)} />
              ) : (
                <div className="a-cat-row">
                  <div className="a-cat-row__order">
                    <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)}><Icon name="up" size={16} /></button>
                    <button type="button" aria-label="Bajar" disabled={i === sorted.length - 1} onClick={() => move(i, 1)}><Icon name="down" size={16} /></button>
                  </div>
                  {c.image?.url ? <img src={c.image.url} alt="" className="a-cat-row__img" /> : <span className="a-thumb-ph a-cat-row__img" aria-hidden="true" />}
                  <div className="a-cat-row__text">
                    <strong>{c.name.es}</strong> <span className="a-muted">/ {c.name.en || '—'}</span>
                    <div className="a-badges">
                      <Badge>{count(c.id)} productos</Badge>
                      {!c.active && <Badge tone="off">Oculta</Badge>}
                      {c.pending && <Badge tone="pending">Pendiente</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setEditing(c.id)}>Editar</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const strip = ({ id: _id, ...rest }: Category) => rest;

function CategoryEditor({ initial, all, onDone, order, productCount = 0 }: { initial?: Category; all: Category[]; onDone: () => void; order: number; productCount?: number }) {
  const [c, setC] = useState<Category>(
    () => initial ?? { id: '', slug: '', name: { es: '', en: '' }, description: { es: '', en: '' }, image: null, order, active: true, pending: false },
  );
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const set = <K extends keyof Category>(k: K, v: Category[K]) => setC((x) => ({ ...x, [k]: v }));
  const slug = c.slug || slugify(c.name.es);
  const id = initial?.id ?? slug;
  const taken = all.some((x) => x.slug === slug && x.id !== initial?.id);

  const save = async () => {
    if (!c.name.es.trim()) return toast('Escribe el nombre en español.', 'error');
    if (taken) return toast('Ya existe una categoría con esa dirección web.', 'error');
    const parsed = Category.safeParse({ ...c, id, slug });
    if (!parsed.success) return toast('Revisa los campos.', 'error');
    setSaving(true);
    try {
      await writeDoc(`categories/${id}`, strip(parsed.data));
      toast('Categoría guardada.');
      onDone();
    } catch (err) {
      toast(`No se pudo guardar: ${(err as Error).message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (productCount > 0) return toast(`Tiene ${productCount} productos. Muévelos a otra categoría antes de eliminarla.`, 'error');
    if (!confirm(`¿Eliminar la categoría «${c.name.es}»?`)) return;
    await deleteImage(c.image);
    await removeDoc(`categories/${id}`);
    toast('Categoría eliminada.');
    onDone();
  };

  return (
    <Panel title={initial ? `Editar: ${initial.name.es}` : 'Nueva categoría'} className="a-cat-editor">
      <L10nInput label="Nombre" value={c.name} onChange={(v) => set('name', v)} />
      <L10nInput label="Descripción (opcional)" value={c.description} onChange={(v) => set('description', v)} multiline={2} help="Aparece bajo el título en la página de la categoría." />
      <TextInput
        label="Dirección web (slug)"
        value={c.slug}
        placeholder={slugify(c.name.es)}
        onChange={(v) => set('slug', slugify(v))}
        help={initial ? 'Cambiarla rompe los enlaces ya compartidos.' : <>alpezleather.com/tienda/<strong>{slug || '…'}</strong></>}
      />
      <ImageField label="Foto de portada" value={c.image} onChange={(v) => set('image', v)} folder={`categories/${id || 'nueva'}`} help="Si no subes una, se usa la primera foto de sus productos." />
      <Toggle label="Visible" checked={c.active} onChange={(v) => set('active', v)} />
      <Toggle label="Marcar como pendiente" checked={c.pending} onChange={(v) => set('pending', v)} />
      <div className="a-row">
        <Button onClick={save} busy={saving}>Guardar</Button>
        <Button variant="ghost" onClick={onDone}>Cancelar</Button>
        {initial && <Button variant="danger" icon="trash" onClick={remove} className="a-push">Eliminar</Button>}
      </div>
    </Panel>
  );
}

/**
 * Formularios declarativos: una lista de campos describe un documento de Firestore.
 * Agregar un texto editable nuevo = agregar una línea al spec.
 */
import type { ReactNode } from 'react';
import { useCollection } from './data';
import { ImageField, ImagesField } from './ImageUploader';
import { Button, Icon, L10nInput, Select, TextInput, Toggle } from './ui';
import type { Product } from '@/lib/schemas';

export type FieldSpec =
  | { type: 'heading'; label: string; help?: ReactNode }
  | { key: string; type: 'l10n'; label: string; help?: ReactNode; rows?: number }
  | { key: string; type: 'l10n-area'; label: string; help?: ReactNode; rows?: number }
  | { key: string; type: 'text'; label: string; help?: ReactNode; placeholder?: string }
  | { key: string; type: 'bool'; label: string; help?: ReactNode }
  | { key: string; type: 'image'; label: string; help?: string; folder: string }
  | { key: string; type: 'images'; label: string; folder: string }
  | { key: string; type: 'product'; label: string; help?: ReactNode }
  | { key: string; type: 'list'; label: string; itemLabel: string; fields: FieldSpec[]; blank: () => unknown; help?: ReactNode };

export function getIn(obj: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

export function setIn<T>(obj: T, key: string, value: unknown): T {
  const [head, ...rest] = key.split('.');
  const base = (obj ?? {}) as Record<string, unknown>;
  return { ...base, [head!]: rest.length ? setIn(base[head!], rest.join('.'), value) : value } as T;
}

function ProductPicker({ label, value, onChange, help }: { label: string; value: string; onChange: (v: string) => void; help?: ReactNode }) {
  const { items } = useCollection<Product>('products');
  return (
    <Select
      label={label}
      value={value || ''}
      onChange={onChange}
      help={help}
      options={[{ value: '', label: 'Automático (primer destacado)' }, ...(items ?? []).filter((p) => p.active).map((p) => ({ value: p.id, label: p.name?.es || p.slug }))]}
    />
  );
}

export function FormFields<T>({ spec, value, onChange }: { spec: FieldSpec[]; value: T; onChange: (v: T) => void }) {
  return (
    <>
      {spec.map((f, i) => {
        if (f.type === 'heading')
          return (
            <div key={`h${i}`} className="a-form-heading">
              <h3>{f.label}</h3>
              {f.help && <p className="a-field__help">{f.help}</p>}
            </div>
          );
        const v = getIn(value, f.key);
        const set = (nv: unknown) => onChange(setIn(value, f.key, nv));
        switch (f.type) {
          case 'l10n':
            return <L10nInput key={f.key} label={f.label} help={f.help} value={v as never} onChange={set} />;
          case 'l10n-area':
            return <L10nInput key={f.key} label={f.label} help={f.help} value={v as never} onChange={set} multiline={f.rows ?? 4} />;
          case 'text':
            return <TextInput key={f.key} label={f.label} help={f.help} placeholder={f.placeholder} value={(v as string) ?? ''} onChange={set} />;
          case 'bool':
            return <Toggle key={f.key} label={f.label} help={f.help} checked={Boolean(v)} onChange={set} />;
          case 'image':
            return <ImageField key={f.key} label={f.label} help={f.help} folder={f.folder} value={v as never} onChange={set} />;
          case 'images':
            return <ImagesField key={f.key} label={f.label} folder={f.folder} value={(v as never[]) ?? []} onChange={set} />;
          case 'product':
            return <ProductPicker key={f.key} label={f.label} help={f.help} value={(v as string) ?? ''} onChange={set} />;
          case 'list': {
            const list = (v as unknown[]) ?? [];
            const update = (idx: number, item: unknown) => set(list.map((x, j) => (j === idx ? item : x)));
            const move = (idx: number, dir: -1 | 1) => {
              const next = [...list];
              const [it] = next.splice(idx, 1);
              next.splice(idx + dir, 0, it);
              set(next);
            };
            return (
              <fieldset key={f.key} className="a-list">
                <legend className="a-field__label">{f.label}</legend>
                {f.help && <p className="a-field__help">{f.help}</p>}
                {list.map((item, idx) => (
                  <div key={idx} className="a-list__item">
                    <div className="a-list__bar">
                      <span className="a-list__n">
                        {f.itemLabel} {idx + 1}
                      </span>
                      <div className="a-list__tools">
                        <button type="button" aria-label="Subir" disabled={idx === 0} onClick={() => move(idx, -1)}><Icon name="up" size={16} /></button>
                        <button type="button" aria-label="Bajar" disabled={idx === list.length - 1} onClick={() => move(idx, 1)}><Icon name="down" size={16} /></button>
                        <button type="button" aria-label="Eliminar" onClick={() => confirm(`¿Eliminar ${f.itemLabel.toLowerCase()} ${idx + 1}?`) && set(list.filter((_, j) => j !== idx))}>
                          <Icon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                    <FormFields spec={f.fields} value={item} onChange={(ni) => update(idx, ni)} />
                  </div>
                ))}
                <Button type="button" variant="ghost" icon="plus" onClick={() => set([...list, f.blank()])}>
                  Añadir {f.itemLabel.toLowerCase()}
                </Button>
              </fieldset>
            );
          }
        }
      })}
    </>
  );
}

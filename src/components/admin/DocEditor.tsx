/** Editor genérico para un documento (contenido o ajustes) con su spec de campos. */
import { useEffect, useState } from 'react';
import type { z } from 'zod';
import { readDoc, writeDoc } from './data';
import { FormFields, type FieldSpec } from './FormFields';
import { Button, Loading, Panel, useToast } from './ui';

function deepMerge<T>(base: T, over: unknown): T {
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(base) || !isObj(over)) return (over ?? base) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObj(out[k]) && isObj(v) ? deepMerge(out[k], v) : v;
  return out as T;
}

export function DocEditor<S extends z.ZodType>({ path, schema, defaults, spec, title }: { path: string; schema: S; defaults: z.infer<S>; spec: FieldSpec[]; title?: string }) {
  const [value, setValue] = useState<z.infer<S> | null>(null);
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setValue(null);
    readDoc(path)
      .then((d) => setValue(deepMerge(defaults, d)))
      .catch((err) => toast(`No se pudo cargar: ${err.message}`, 'error'));
  }, [path]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => !saved && e.preventDefault();
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [saved]);

  if (!value) return <Loading />;

  const save = async () => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return toast(`Revisa «${issue?.path.join(' › ')}»: ${issue?.message}`, 'error');
    }
    setSaving(true);
    try {
      await writeDoc(path, parsed.data);
      setSaved(true);
      toast('Guardado. Pulsa «Publicar cambios» para verlo al instante.');
    } catch (err) {
      toast(`No se pudo guardar: ${(err as Error).message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title={title}
      actions={
        <Button onClick={save} busy={saving} disabled={saved && !saving}>
          {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
        </Button>
      }
      className="a-doc"
    >
      <FormFields
        spec={spec}
        value={value}
        onChange={(v) => {
          setValue(v);
          setSaved(false);
        }}
      />
      <div className="a-doc__foot">
        <Button onClick={save} busy={saving} disabled={saved && !saving}>
          {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
        </Button>
      </div>
    </Panel>
  );
}

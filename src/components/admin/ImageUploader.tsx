import { useRef, useState } from 'react';
import type { ImageRef } from '@/lib/schemas';
import { deleteImage, uploadImage } from './data';
import { Button, Icon, useToast } from './ui';

function useUploader(folder: string) {
  const [busy, setBusy] = useState(0);
  const toast = useToast();
  const upload = async (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) return [];
    setBusy((n) => n + imgs.length);
    const out: ImageRef[] = [];
    for (const f of imgs) {
      try {
        if (f.size > 25 * 1024 * 1024) throw new Error('La foto pesa más de 25 MB');
        out.push(await uploadImage(f, folder));
      } catch (err) {
        toast(`No se pudo subir ${f.name}: ${(err as Error).message}`, 'error');
      } finally {
        setBusy((n) => n - 1);
      }
    }
    return out;
  };
  return { busy, upload };
}

function DropZone({ onFiles, multiple, busy, label }: { onFiles: (f: File[]) => void; multiple?: boolean; busy: number; label: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      className={`a-drop ${over ? 'is-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles([...e.dataTransfer.files]);
      }}
    >
      <input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => (onFiles([...(e.target.files ?? [])]), (e.target.value = ''))} />
      <Icon name="upload" size={22} />
      <p>
        {busy ? `Subiendo ${busy} foto${busy > 1 ? 's' : ''}…` : label}
      </p>
      <Button type="button" variant="ghost" onClick={() => input.current?.click()} busy={busy > 0}>
        Elegir {multiple ? 'fotos' : 'foto'}
      </Button>
      <p className="a-field__help">JPG, PNG o HEIC. Se optimizan automáticamente (WebP, máx. 2000 px).</p>
    </div>
  );
}

/** Una sola imagen (portada de categoría, imagen de sección, etc.) */
export function ImageField({ label, value, onChange, folder, help }: { label: string; value: ImageRef | null | undefined; onChange: (v: ImageRef | null) => void; folder: string; help?: string }) {
  const { busy, upload } = useUploader(folder);
  return (
    <div className="a-field">
      <span className="a-field__label">{label}</span>
      {value?.url ? (
        <div className="a-img-single">
          <img src={value.url} alt="" />
          <Button
            type="button"
            variant="danger"
            icon="trash"
            onClick={async () => {
              if (!confirm('¿Quitar esta foto?')) return;
              await deleteImage(value);
              onChange(null);
            }}
          >
            Quitar
          </Button>
        </div>
      ) : (
        <DropZone
          busy={busy}
          label="Arrastra una foto aquí"
          onFiles={async (f) => {
            const [img] = await upload(f.slice(0, 1));
            if (img) onChange(img);
          }}
        />
      )}
      {help && <p className="a-field__help">{help}</p>}
    </div>
  );
}

/** Galería ordenable (fotos de producto). La primera es la portada. */
export function ImagesField({ label, value, onChange, folder }: { label: string; value: ImageRef[]; onChange: (v: ImageRef[]) => void; folder: string }) {
  const { busy, upload } = useUploader(folder);
  const [drag, setDrag] = useState<number | null>(null);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it!);
    onChange(next);
  };
  return (
    <div className="a-field">
      <span className="a-field__label">{label}</span>
      {value.length > 0 && (
        <ul className="a-gallery" role="list">
          {value.map((img, i) => (
            <li
              key={img.path || img.url}
              className={`a-gallery__item ${drag === i ? 'is-drag' : ''}`}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag !== null) move(drag, i);
                setDrag(null);
              }}
              onDragEnd={() => setDrag(null)}
            >
              <img src={img.url} alt="" />
              {i === 0 && <span className="a-badge a-badge--brass a-gallery__cover">Portada</span>}
              <div className="a-gallery__tools">
                <button type="button" aria-label="Mover a la izquierda" onClick={() => move(i, i - 1)} disabled={i === 0}>
                  <Icon name="left" size={16} />
                </button>
                <button type="button" aria-label="Mover a la derecha" onClick={() => move(i, i + 1)} disabled={i === value.length - 1}>
                  <Icon name="right" size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Eliminar foto"
                  onClick={async () => {
                    if (!confirm('¿Eliminar esta foto?')) return;
                    await deleteImage(img);
                    onChange(value.filter((_, j) => j !== i));
                  }}
                >
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <DropZone multiple busy={busy} label="Arrastra fotos aquí (puedes elegir varias)" onFiles={async (f) => onChange([...value, ...(await upload(f))])} />
      <p className="a-field__help">Arrastra las miniaturas para ordenarlas. La primera es la portada en la tienda; la segunda aparece al pasar el cursor.</p>
    </div>
  );
}

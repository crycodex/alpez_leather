/** Piezas de interfaz del panel. Mismo mundo que el sitio, en clave de trabajo. */
import { createContext, useCallback, useContext, useId, useState, type ReactNode } from 'react';
import type { L10n } from '@/lib/schemas';

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const p: Record<string, ReactNode> = {
    dashboard: <><path d="M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-4H4v4Zm10-16v4h6V4h-6Z" /></>,
    box: <><path d="M4 8 12 4l8 4v8l-8 4-8-4V8Z" /><path d="m4 8 8 4 8-4M12 12v8" /></>,
    tag: <><path d="M4 12V4h8l8 8-8 8-8-8Z" /><circle cx="8.5" cy="8.5" r="1.3" /></>,
    text: <><path d="M5 6h14M5 12h14M5 18h9" /></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></>,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    trash: <><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" /></>,
    up: <path d="m6 15 6-6 6 6" />,
    down: <path d="m6 9 6 6 6-6" />,
    left: <path d="m15 6-6 6 6 6" />,
    right: <path d="m9 6 6 6-6 6" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
    external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v6H4V6h6" /></>,
    logout: <><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></>,
    send: <><path d="M4 12 20 4l-6 16-3-7-7-1Z" /></>,
    star: <path d="m12 4 2.5 5.2 5.5.8-4 3.9.9 5.6L12 17l-4.9 2.5.9-5.6-4-3.9 5.5-.8L12 4Z" />,
    menu: <path d="M4 8h16M4 16h16" />,
    search: <><circle cx="11" cy="11" r="6" /><path d="m20 20-4.5-4.5" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {p[name]}
    </svg>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'quiet'; icon?: string; busy?: boolean };
export function Button({ variant = 'primary', icon, busy, children, className = '', ...rest }: BtnProps) {
  return (
    <button className={`a-btn a-btn--${variant} ${className}`} disabled={busy || rest.disabled} aria-busy={busy || undefined} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Field({ label, help, children, htmlFor }: { label: string; help?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="a-field">
      <label className="a-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {help && <p className="a-field__help">{help}</p>}
    </div>
  );
}

export function TextInput({ label, value, onChange, help, multiline, type = 'text', placeholder, required, ...rest }: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  help?: ReactNode;
  multiline?: boolean | number;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
  step?: number | string;
}) {
  const id = useId();
  return (
    <Field label={label} help={help} htmlFor={id}>
      {multiline ? (
        <textarea id={id} className="a-input" rows={typeof multiline === 'number' ? multiline : 4} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} className="a-input" type={type} value={value} placeholder={placeholder} required={required} onChange={(e) => onChange(e.target.value)} {...rest} />
      )}
    </Field>
  );
}

/** Campo bilingüe: español (obligatorio para publicar) + inglés (opcional, cae a español). */
export function L10nInput({ label, value, onChange, multiline, help }: { label: string; value: L10n | undefined; onChange: (v: L10n) => void; multiline?: boolean | number; help?: ReactNode }) {
  const v = value ?? { es: '', en: '' };
  const idEs = useId();
  const idEn = useId();
  const rows = typeof multiline === 'number' ? multiline : 4;
  return (
    <fieldset className="a-l10n">
      <legend className="a-field__label">{label}</legend>
      <div className="a-l10n__grid">
        {(['es', 'en'] as const).map((lang) => (
          <div key={lang} className="a-l10n__col">
            <label htmlFor={lang === 'es' ? idEs : idEn} className="a-l10n__lang">
              {lang === 'es' ? 'Español' : 'English'}
              {lang === 'en' && !v.en && v.es && <span className="a-badge a-badge--muted">usa español</span>}
            </label>
            {multiline ? (
              <textarea id={lang === 'es' ? idEs : idEn} className="a-input" rows={rows} value={v[lang]} onChange={(e) => onChange({ ...v, [lang]: e.target.value })} />
            ) : (
              <input id={lang === 'es' ? idEs : idEn} className="a-input" value={v[lang]} onChange={(e) => onChange({ ...v, [lang]: e.target.value })} />
            )}
          </div>
        ))}
      </div>
      {help && <p className="a-field__help">{help}</p>}
    </fieldset>
  );
}

export function Toggle({ label, checked, onChange, help }: { label: string; checked: boolean; onChange: (v: boolean) => void; help?: ReactNode }) {
  const id = useId();
  return (
    <div className="a-toggle">
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>
        <span className="a-toggle__track" aria-hidden="true" />
        <span>
          <span className="a-toggle__label">{label}</span>
          {help && <span className="a-field__help">{help}</span>}
        </span>
      </label>
    </div>
  );
}

export function Select<T extends string>({ label, value, onChange, options, help }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; help?: ReactNode }) {
  const id = useId();
  return (
    <Field label={label} help={help} htmlFor={id}>
      <select id={id} className="a-input a-select" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'pending' | 'ok' | 'off' | 'brass' }) {
  return <span className={`a-badge a-badge--${tone}`}>{children}</span>;
}

export function Panel({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`a-panel ${className}`}>
      {(title || actions) && (
        <header className="a-panel__head">
          {title && <h2 className="a-panel__title">{title}</h2>}
          {actions && <div className="a-panel__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHead({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="a-page-head">
      <div>
        <h1 className="a-page-title">{title}</h1>
        {description && <p className="a-page-desc">{description}</p>}
      </div>
      {actions && <div className="a-page-actions">{actions}</div>}
    </header>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="a-empty">
      <svg viewBox="0 0 120 60" fill="none" aria-hidden="true">
        <path d="M6 56 44 22l16 13" />
        <path d="M40 40 70 6l44 50" />
      </svg>
      <p className="a-empty__title">{title}</p>
      {children}
    </div>
  );
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="a-loading" role="status">
      <span className="a-spinner" aria-hidden="true" /> {label}
    </div>
  );
}

/* ─── Avisos (toasts) ───────────────────────── */
type Toast = { id: number; text: string; tone: 'ok' | 'error' };
const ToastCtx = createContext<(text: string, tone?: Toast['tone']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="a-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`a-toast a-toast--${t.tone}`}>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const fmtMoney = (n: number) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n || 0);
export const fmtNum = (n: number) => new Intl.NumberFormat('es-EC').format(n || 0);
export const fmtDate = (ms: number) => new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(ms);

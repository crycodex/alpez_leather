/** Selector propio (listbox WAI-ARIA) para reemplazar el <select> nativo en el panel. */
import { useEffect, useId, useRef, useState } from 'react';

export interface Opt<T extends string> {
  value: T;
  label: string;
}

export function Listbox<T extends string>({ value, onChange, options, ariaLabel, labelledBy, id, className = '' }: {
  value: T;
  onChange: (v: T) => void;
  options: Opt<T>[];
  ariaLabel?: string;
  labelledBy?: string;
  id?: string;
  className?: string;
}) {
  const auto = useId();
  const btnId = id ?? `lb-${auto}`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    list.current?.focus();
    const off = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', off);
    return () => document.removeEventListener('mousedown', off);
  }, [open]);

  useEffect(() => {
    list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const choose = (i: number) => {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
    btn.current?.focus();
  };

  return (
    <div className={`a-lb ${className}`} ref={root}>
      <button
        ref={btn}
        id={btnId}
        type="button"
        className="a-input a-lb__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ? `${ariaLabel}: ${current?.label ?? ''}` : undefined}
        aria-labelledby={labelledBy ? `${labelledBy} ${btnId}` : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{current?.label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <ul
          ref={list}
          className="a-lb__list"
          role="listbox"
          tabIndex={-1}
          aria-activedescendant={`${btnId}-o${active}`}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setActive((a) => Math.min(options.length - 1, a + 1));
            else if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1));
            else if (e.key === 'Home') setActive(0);
            else if (e.key === 'End') setActive(options.length - 1);
            else if (e.key === 'Enter' || e.key === ' ') choose(active);
            else if (e.key === 'Escape') {
              setOpen(false);
              btn.current?.focus();
            } else if (e.key === 'Tab') setOpen(false);
            else return;
            e.preventDefault();
          }}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${btnId}-o${i}`}
              data-i={i}
              role="option"
              aria-selected={o.value === value}
              className={i === active ? 'is-active' : ''}
              onMouseMove={() => setActive(i)}
              onClick={() => choose(i)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" /></svg>
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Casilla propia. */
export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="a-check">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.2 4.2L19 7" /></svg>
      </span>
    </label>
  );
}

import { useEffect, useState } from 'react';
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { fb, firebaseConfigured } from '@/lib/firebase/client';
import { Button, Icon, Loading, ToastProvider, useToast } from './ui';
import { publish } from './data';
import Dashboard from './Dashboard';
import Products from './Products';
import Categories from './Categories';
import Content from './Content';
import Orders from './Orders';
import Settings from './Settings';

const ROUTES = [
  { id: 'inicio', label: 'Resumen', icon: 'dashboard', C: Dashboard },
  { id: 'productos', label: 'Productos', icon: 'box', C: Products },
  { id: 'categorias', label: 'Categorías', icon: 'tag', C: Categories },
  { id: 'contenido', label: 'Textos y fotos', icon: 'text', C: Content },
  { id: 'pedidos', label: 'Pedidos', icon: 'receipt', C: Orders },
  { id: 'ajustes', label: 'Ajustes', icon: 'gear', C: Settings },
] as const;

export type RouteId = (typeof ROUTES)[number]['id'];

function useHashRoute(): [string, string | undefined] {
  const read = () => location.hash.replace(/^#\/?/, '').split('/') as [string, string | undefined];
  const [r, setR] = useState(read);
  useEffect(() => {
    const on = () => setR(read());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return [r[0] || 'inicio', r[1]];
}

export const go = (path: string) => (location.hash = `#/${path}`);

export default function AdminApp() {
  return (
    <ToastProvider>
      {firebaseConfigured ? <Gate /> : <SetupNeeded />}
    </ToastProvider>
  );
}

function SetupNeeded() {
  return (
    <main className="a-auth">
      <div className="a-auth__card">
        <img src="/brand/logo-choc.png" alt="Alpez Leather" width="160" />
        <h1>Falta conectar Firebase</h1>
        <p>
          El panel necesita las variables <code>PUBLIC_FIREBASE_*</code> en el archivo <code>.env</code> (local) o en Vercel. Sigue la guía{' '}
          <code>docs/FIREBASE.md</code>.
        </p>
        <p className="a-field__help">Mientras tanto, el sitio público funciona con contenido de ejemplo.</p>
      </div>
    </main>
  );
}

type AuthState = { status: 'loading' } | { status: 'out' } | { status: 'denied'; user: User } | { status: 'in'; user: User };

function Gate() {
  const [state, setState] = useState<AuthState>({ status: 'loading' });
  useEffect(
    () =>
      onAuthStateChanged(fb().auth, async (user) => {
        if (!user) return setState({ status: 'out' });
        try {
          const snap = await getDoc(doc(fb().db, 'admins', user.uid));
          setState(snap.exists() ? { status: 'in', user } : { status: 'denied', user });
        } catch {
          setState({ status: 'denied', user });
        }
      }),
    [],
  );
  if (state.status === 'loading') return <main className="a-auth"><Loading /></main>;
  if (state.status === 'out') return <Login />;
  if (state.status === 'denied')
    return (
      <main className="a-auth">
        <div className="a-auth__card">
          <img src="/brand/logo-choc.png" alt="Alpez Leather" width="140" />
          <h1>Sin acceso</h1>
          <p>
            La cuenta <strong>{state.user.email}</strong> no es administradora. Pide que la agreguen con <code>npm run create-admin</code>.
          </p>
          <p className="a-field__help num">UID: {state.user.uid}</p>
          <Button variant="ghost" onClick={() => signOut(fb().auth)}>Cerrar sesión</Button>
        </div>
      </main>
    );
  return <Shell user={state.user} />;
}

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(fb().auth, email.trim(), password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setError(
        code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')
          ? 'Correo o contraseña incorrectos.'
          : code.includes('too-many-requests')
            ? 'Demasiados intentos. Espera unos minutos o restablece la contraseña.'
            : 'No pudimos iniciar sesión. Revisa tu conexión.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="a-auth">
      <form className="a-auth__card" onSubmit={submit}>
        <img src="/brand/logo-choc.png" alt="Alpez Leather" width="160" />
        <h1>Panel de administración</h1>
        <div className="a-field">
          <label className="a-field__label" htmlFor="email">Correo</label>
          <input id="email" className="a-input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="a-field">
          <label className="a-field__label" htmlFor="pw">Contraseña</label>
          <input id="pw" className="a-input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="a-error" role="alert">{error}</p>}
        <Button type="submit" busy={busy}>{busy ? 'Entrando…' : 'Entrar'}</Button>
        <button
          type="button"
          className="a-link"
          onClick={async () => {
            if (!email) return setError('Escribe tu correo arriba para enviarte el enlace.');
            await sendPasswordResetEmail(fb().auth, email.trim()).catch(() => {});
            toast('Si el correo existe, te enviamos un enlace para restablecer la contraseña.');
          }}
        >
          Olvidé mi contraseña
        </button>
      </form>
    </main>
  );
}

function Shell({ user }: { user: User }) {
  const [route, param] = useHashRoute();
  const [navOpen, setNavOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const toast = useToast();
  const current = ROUTES.find((r) => r.id === route) ?? ROUTES[0];
  const Page = current.C;
  useEffect(() => {
    setNavOpen(false);
    window.scrollTo(0, 0);
  }, [route, param]);

  const doPublish = async () => {
    setPublishing(true);
    try {
      const r = await publish();
      toast(r.note ?? `Sitio actualizado (${r.revalidated} páginas).`);
    } catch (err) {
      toast(`No se pudo publicar: ${(err as Error).message}`, 'error');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="a-shell">
      <aside className={`a-side ${navOpen ? 'is-open' : ''}`}>
        <div className="a-side__brand">
          <img src="/brand/logo-sand.png" alt="Alpez Leather" width="110" />
        </div>
        <nav aria-label="Secciones del panel">
          <ul role="list" className="a-nav">
            {ROUTES.map((r) => (
              <li key={r.id}>
                <a href={`#/${r.id}`} aria-current={r.id === current.id ? 'page' : undefined}>
                  <Icon name={r.icon} /> {r.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="a-side__foot">
          <Button variant="primary" icon="send" onClick={doPublish} busy={publishing} className="a-publish">
            {publishing ? 'Publicando…' : 'Publicar cambios'}
          </Button>
          <p className="a-side__hint">Los cambios se ven en el sitio en máx. 5 min, o al instante con «Publicar».</p>
          <a className="a-side__link" href="/" target="_blank" rel="noopener">
            <Icon name="external" size={16} /> Ver sitio
          </a>
          <div className="a-side__user">
            <span title={user.email ?? ''}>{user.email}</span>
            <button type="button" onClick={() => signOut(fb().auth)} aria-label="Cerrar sesión">
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </aside>

      <div className="a-main">
        <header className="a-topbar">
          <button type="button" className="a-topbar__menu" onClick={() => setNavOpen((v) => !v)} aria-expanded={navOpen} aria-label="Menú">
            <Icon name="menu" size={22} />
          </button>
          <img src="/brand/word-choc.png" alt="Alpez" width="80" />
          <Button variant="ghost" icon="send" onClick={doPublish} busy={publishing}>Publicar</Button>
        </header>
        <main className="a-content">
          <Page param={param} />
        </main>
      </div>
      {navOpen && <div className="a-scrim" onClick={() => setNavOpen(false)} />}
    </div>
  );
}

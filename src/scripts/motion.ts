/**
 * Movimiento "Golpe de marca": el sello se presiona.
 * - Lenis: scroll suave, conducido por el ticker de GSAP.
 * - [data-press]: el texto pasa de plano a hundido al entrar en vista.
 * - [data-press-chars]: igual, letra por letra (titular del hero).
 * - [data-reveal]: imágenes que se descubren de abajo hacia arriba.
 * - [data-rise]: grupos que entran escalonados.
 * - [data-stitch]: pespuntes que se cosen de izquierda a derecha.
 * - [data-hero-press]: el sello del hero se hunde con el scroll.
 * Todo el contenido es visible sin JS y con prefers-reduced-motion.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let lenis: Lenis | null = null;
let ctx: gsap.Context | null = null;
const splits: SplitText[] = [];

function startLenis() {
  if (lenis || reduced()) return;
  lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.addEventListener('alpez:scroll-lock', (e) => ((e as CustomEvent<boolean>).detail ? lenis?.stop() : lenis?.start()));
}

function animate() {
  if (reduced()) return;
  ctx = gsap.context(() => {
    // Titular del hero: cada letra se presiona en el cuero
    document.querySelectorAll<HTMLElement>('[data-press-chars]').forEach((el) => {
      const split = SplitText.create(el, { type: 'chars', charsClass: 'press-char' });
      splits.push(split);
      gsap.fromTo(
        split.chars,
        { '--press': 0, yPercent: -6, opacity: 0.0 },
        { '--press': 1, yPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.15 },
      );
    });

    scenes();

    gsap.utils.toArray<HTMLElement>('[data-press]').forEach((el) => {
      gsap.fromTo(
        el,
        { '--press': 0, y: 18, opacity: 0 },
        { '--press': 1, y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } },
      );
    });

    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.06 },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } },
      );
    });

    gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((group) => {
      const kids = group.children;
      gsap.fromTo(
        kids,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: group, start: 'top 88%', once: true } },
      );
    });

    gsap.utils.toArray<HTMLElement>('[data-stitch]').forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 92%', once: true } },
      );
    });
  });
}

/**
 * Escenas a pantalla completa, conducidas por el scroll (scrub + pin).
 * Escritorio y móvil tienen su propia versión; con movimiento reducido no existen.
 */
let mm: gsap.MatchMedia | null = null;
function scenes() {
  mm = gsap.matchMedia();
  mm.add(
    { desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' },
    (c) => {
      const { desktop } = c.conditions as { desktop: boolean };
      // Las escenas se fijan justo debajo del header sticky
      const top = () => `top ${document.querySelector<HTMLElement>('[data-header]')?.offsetHeight ?? 0}px`;

      // 1. Hero: el sello se presiona y se aleja, la pieza sube, el texto se va
      const hero = document.querySelector<HTMLElement>('[data-hero]');
      if (hero) {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: hero, start: top, end: desktop ? '+=90%' : '+=60%', scrub: 0.8, pin: true, anticipatePin: 1 },
        });
        tl.to(hero.querySelector('[data-hero-press]'), { scale: desktop ? 0.78 : 0.88, yPercent: -12, '--press': 2.2, transformOrigin: 'left top' }, 0)
          .to(hero.querySelector('.hero__copy'), { autoAlpha: 0, y: -60 }, 0)
          .to(hero.querySelector('.hero__piece'), { yPercent: desktop ? -22 : -10, scale: 1.04 }, 0);
      }

      // 2. Categorías: recorrido horizontal fijado (solo escritorio)
      const cats = document.querySelector<HTMLElement>('[data-hscroll]');
      const row = cats?.querySelector<HTMLElement>('[data-hscroll-row]');
      if (desktop && cats && row) {
        row.classList.add('is-hscroll');
        const dist = () => Math.max(0, row.scrollWidth - row.clientWidth);
        if (dist() > 40) {
          gsap.to(row.children, {
            x: () => -dist(),
            ease: 'none',
            scrollTrigger: { trigger: cats, start: top, end: () => `+=${dist()}`, scrub: 0.8, pin: true, invalidateOnRefresh: true },
          });
        }
      }

      // 3. Manifiesto: las palabras se encienden con el scroll, pantalla completa
      document.querySelectorAll<HTMLElement>('[data-words]').forEach((el) => {
        const split = SplitText.create(el, { type: 'words' });
        splits.push(split);
        gsap.fromTo(
          split.words,
          { opacity: 0.14 },
          { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: el.closest('section') ?? el, start: top, end: '+=70%', scrub: 0.6, pin: true } },
        );
      });

      // 4. Cierre: el título crece hasta su tamaño a medida que llega
      document.querySelectorAll<HTMLElement>('[data-grow]').forEach((el) => {
        gsap.fromTo(el, { scale: 0.86, opacity: 0.4 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 40%', scrub: 0.6 } });
      });

      return () => row?.classList.remove('is-hscroll');
    },
  );
}

function cleanup() {
  mm?.revert();
  mm = null;
  ctx?.revert();
  ctx = null;
  splits.splice(0).forEach((s) => s.revert());
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

document.addEventListener('astro:page-load', () => {
  startLenis();
  lenis?.resize();
  animate();
  requestAnimationFrame(() => ScrollTrigger.refresh());
});
document.addEventListener('astro:before-swap', cleanup);

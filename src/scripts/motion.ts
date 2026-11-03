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

    // El sello del hero se hunde más al hacer scroll
    document.querySelectorAll<HTMLElement>('[data-hero-press]').forEach((el) => {
      gsap.to(el, {
        scale: 0.94,
        '--press': 1.8,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top+=80', end: 'bottom top', scrub: 0.6 },
      });
    });

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

function cleanup() {
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

import { inView, stagger } from 'motion';
import { animate } from 'motion/mini';

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = document.querySelector<HTMLElement>('[data-page-loader]');
let loadingFinished = false;
const loaderFailsafe = window.setTimeout(() => loader?.remove(), 4000);

const finishLoading = async () => {
  if (!loader || loadingFinished) return;
  loadingFinished = true;
  loader.style.pointerEvents = 'none';

  if (reduceMotion) {
    window.clearTimeout(loaderFailsafe);
    loader.remove();
    return;
  }

  try {
    await animate(
      loader,
      { opacity: [1, 0] },
      { duration: 0.55, delay: 0.25, ease: [0.65, 0, 0.35, 1] }
    ).finished;
  } finally {
    window.clearTimeout(loaderFailsafe);
    loader.remove();
  }
};

const runMotion = () => {
  if (reduceMotion) return;

  root.classList.add('motion-ready');

  const heroItems = document.querySelectorAll<HTMLElement>('[data-hero-reveal]');
  if (heroItems.length) {
    animate(
      heroItems,
      { opacity: [0, 1], transform: ['translateY(28px)', 'translateY(0)'] },
      { duration: 0.9, delay: stagger(0.1, { startDelay: 0.34 }), ease: [0.16, 1, 0.3, 1] }
    );
  }

  const heroVisual = document.querySelector<HTMLElement>('[data-hero-visual]');
  if (heroVisual) {
    animate(
      heroVisual,
      { opacity: [0, 1], transform: ['translateY(36px) scale(.975)', 'translateY(0) scale(1)'] },
      { duration: 1.15, delay: 0.46, ease: [0.16, 1, 0.3, 1] }
    );
  }

  const observed = new Set<Element>();
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
    inView(
      element,
      () => {
        if (observed.has(element)) return;
        observed.add(element);

        const siblings =
          element.parentElement?.querySelectorAll<HTMLElement>(':scope > [data-reveal]');
        const delay = siblings ? Math.max(0, Array.from(siblings).indexOf(element)) * 0.07 : 0;

        animate(
          element,
          { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] },
          { duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }
        );
      },
      { amount: 0.18, margin: '0px 0px -8% 0px' }
    );
  });

  document.querySelectorAll<HTMLElement>('[data-image-reveal]').forEach((element) => {
    inView(
      element,
      () => {
        animate(
          element,
          { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] },
          { duration: 1.05, ease: [0.77, 0, 0.18, 1] }
        );

        const image = element.querySelector('img');
        if (image) {
          animate(
            image,
            { transform: ['scale(1.065)', 'scale(1)'] },
            { duration: 1.3, ease: [0.16, 1, 0.3, 1] }
          );
        }
      },
      { amount: 0.16 }
    );
  });
};

runMotion();

if (document.readyState === 'complete') {
  void finishLoading();
} else {
  window.addEventListener('load', () => void finishLoading(), { once: true });
  window.setTimeout(() => void finishLoading(), 3200);
}

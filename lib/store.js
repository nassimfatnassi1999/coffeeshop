/**
 * Petit "store" partagé entre composants (sans librairie).
 * Les valeurs sont mutables : la scène 3D les lit à chaque frame.
 */
export const app = {
  lenis: null,
  ready: false,
};

/** État de la scène 3D du hero */
export const hero = {
  progress: 0, // 0 -> 1 pendant le scroll du hero
  intro: 0, // 0 -> 1 animation d'entrée
  mouseX: 0, // -1 -> 1
  mouseY: 0,
};

/** Progression du chargement (séquence d'images) */
export const loading = {
  progress: 0,
  done: false,
};

export const cart = { count: 0 };

export function emit(name, detail) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(`kahwa:${name}`, { detail }));
}

export function on(name, fn) {
  const handler = (e) => fn(e.detail);
  window.addEventListener(`kahwa:${name}`, handler);
  return () => window.removeEventListener(`kahwa:${name}`, handler);
}

/** Scroll fluide vers une ancre (via Lenis si disponible). */
export function scrollToId(id) {
  const el = document.querySelector(id);
  if (!el) return;
  if (app.lenis) app.lenis.scrollTo(el, { offset: 0, duration: 1.6 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

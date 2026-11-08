// The home page hero: a quiet, looping Round Robin trace. The schedule is static HTML
// (complete without JavaScript); this only adds compositor animations on transform and
// opacity. Paused when the tab is hidden or the hero is off screen. With reduced motion
// the static final frame stays.

const UNIT_MS = 480;
const HOLD_MS = 2200;

const num = (el, prefix) => {
  for (const c of el.classList) if (c.startsWith(prefix)) return Number(c.slice(prefix.length));
  return 0;
};

export function initHero(el) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const T = Number(el.dataset.t);
  const total = T * UNIT_MS + HOLD_MS;
  const at = (t) => (t * UNIT_MS) / total;
  const timing = { duration: total, iterations: Infinity, easing: 'linear' };
  const anims = [];

  for (const bar of el.querySelectorAll('.mb')) {
    const s = num(bar, 's-');
    const e = s + num(bar, 'l-');
    const fill = bar.querySelector('.mf');
    const lbl = bar.querySelector('.mfl');
    const frames = (from, to) => [
      { transform: from, offset: 0 },
      { transform: from, offset: at(s) },
      { transform: to, offset: at(e) },
      { transform: to, offset: 1 },
    ];
    anims.push(fill.animate(frames('translateX(-100%)', 'translateX(0%)'), timing));
    anims.push(lbl.animate(frames('translateX(100%)', 'translateX(0%)'), timing));
  }
  const line = el.querySelector('.mini-line');
  anims.push(
    line.animate(
      [
        { transform: 'translateX(0%)', offset: 0 },
        { transform: 'translateX(100%)', offset: at(T) },
        { transform: 'translateX(100%)', offset: 1 },
      ],
      timing,
    ),
  );
  // Fade out at the end of each loop and back in at the start.
  anims.push(
    el.animate(
      [
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.04 },
        { opacity: 1, offset: 0.95 },
        { opacity: 0, offset: 1 },
      ],
      timing,
    ),
  );
  el.classList.add('playing');

  let visible = true;
  const sync = () => {
    const run = visible && !document.hidden;
    for (const a of anims) {
      if (run && a.playState === 'paused') a.play();
      else if (!run && a.playState === 'running') a.pause();
    }
  };
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    sync();
  }).observe(el);
}

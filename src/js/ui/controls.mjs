// Playback clock and transport controls. One requestAnimationFrame loop that runs
// only while playing or gliding, driven by frame timestamps (never setInterval).

import { prefersReducedMotion } from './dom.mjs';

export const UNIT_MS = 600; // one time unit per 600 ms at 1x
const GLIDE_MS = 220;
export const SPEEDS = [0.5, 1, 2, 4];
const ease = (p) => 1 - Math.pow(1 - p, 3);
const near = (a, b) => Math.abs(a - b) < 1e-6;

/**
 * @param {{ onFrame(time:number), onUnit(k:number, info:{prev:number, playing:boolean}), onState(state) }} hooks
 */
export function createPlayer({ onFrame, onUnit, onState }) {
  let T = 0;
  let time = 0;
  let playing = false;
  let speed = 1;
  let raf = 0;
  let last = 0;
  let glide = null;
  let unit = -1;

  const reduced = () => prefersReducedMotion();
  const unitOf = (t) => (t >= T ? T : Math.floor(t + 1e-9));

  function emit() {
    const shown = reduced() && playing ? Math.floor(time + 1e-9) : time;
    onFrame(shown);
    const k = unitOf(time);
    if (k !== unit) {
      const prev = unit;
      unit = k;
      onUnit(k, { prev, playing });
    }
  }

  function schedule() {
    if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function frame(ts) {
    raf = 0;
    if (glide) {
      if (glide.t0 === null) glide.t0 = ts;
      const p = Math.min(1, (ts - glide.t0) / GLIDE_MS);
      time = glide.from + (glide.to - glide.from) * ease(p);
      if (p >= 1) {
        time = glide.to;
        glide = null;
      }
    } else if (playing) {
      const dt = last ? Math.min(100, ts - last) : 0;
      last = ts;
      time = Math.min(T, time + (dt / UNIT_MS) * speed);
      if (time >= T) {
        time = T;
        setPlaying(false);
      }
    }
    emit();
    if (playing || glide) schedule();
  }

  function setPlaying(on) {
    if (on === playing) return;
    playing = on;
    last = 0;
    if (on) glide = null;
    onState({ playing, speed, time });
    if (on) schedule();
  }

  function seek(target, { animate = true } = {}) {
    const to = Math.max(0, Math.min(T, target));
    setPlaying(false);
    if (!animate || reduced() || near(to, time)) {
      glide = null;
      time = to;
      emit();
      return;
    }
    glide = { from: time, to, t0: null };
    schedule();
  }

  /** The time a step lands on: the next or previous whole unit. */
  const base = () => (glide ? glide.to : time);
  function stepForward() {
    const t = base();
    const r = Math.round(t);
    seek(near(t, r) ? r + 1 : Math.ceil(t));
  }
  function stepBack() {
    const t = base();
    const r = Math.round(t);
    seek(near(t, r) ? r - 1 : Math.floor(t));
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    } else if (playing || glide) {
      last = 0;
      schedule();
    }
  });

  return {
    play() {
      if (T === 0) return;
      if (time >= T) {
        time = 0;
        emit();
      }
      setPlaying(true);
    },
    pause() {
      setPlaying(false);
    },
    toggle() {
      if (playing) this.pause();
      else this.play();
    },
    stepForward,
    stepBack,
    seek,
    /** Set the timeline length and go back to t = 0. */
    load(length) {
      setPlaying(false);
      glide = null;
      T = length;
      time = 0;
      unit = -1;
      emit();
    },
    setSpeed(s) {
      speed = s;
      onState({ playing, speed, time });
    },
    get time() {
      return time;
    },
    get length() {
      return T;
    },
    get playing() {
      return playing;
    },
    get speed() {
      return speed;
    },
  };
}

/** Wire the transport buttons in the stage to a player. */
export function bindTransport(stage, player, { onUserStep }) {
  const q = (sel) => stage.querySelector(sel);
  const play = q('[data-act="play"]');
  const speedButtons = [...stage.querySelectorAll('[data-speed] button')];
  const cycle = q('[data-speed-cycle]');
  const cycleLabel = q('[data-speed-cycle-label]');

  const press = (fn) => () => {
    fn();
    onUserStep();
  };
  play.addEventListener('click', () => {
    const wasPlaying = player.playing;
    player.toggle();
    if (wasPlaying) onUserStep();
  });
  q('[data-act="back"]').addEventListener('click', press(() => player.stepBack()));
  q('[data-act="fwd"]').addEventListener('click', press(() => player.stepForward()));
  q('[data-act="reset"]').addEventListener('click', press(() => player.seek(0)));
  for (const b of speedButtons) b.addEventListener('click', () => player.setSpeed(Number(b.dataset.value)));
  cycle.addEventListener('click', () => {
    const i = SPEEDS.indexOf(player.speed);
    player.setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
  });

  return function showState({ playing, speed }) {
    play.toggleAttribute('data-playing', playing);
    play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    for (const b of speedButtons) b.setAttribute('aria-pressed', String(Number(b.dataset.value) === speed));
    cycleLabel.textContent = `${speed}x`;
    cycle.setAttribute('aria-label', `Speed ${speed}x, change speed`);
  };
}

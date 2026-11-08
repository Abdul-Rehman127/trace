// Build-time "mini timelines": static HTML schedules for the home page hero and the
// worked examples. Positions come from utility classes (.s-N start, .l-N length,
// .b-N slice boundary, .T-N timeline length, .cN process color) because the CSP
// forbids style attributes. The browser can animate them (hero) but they are
// complete without JavaScript.

const slot = (id) => Number(id.slice(1));

export function rulerStep(T) {
  if (T <= 16) return 1;
  if (T <= 40) return 5;
  if (T <= 80) return 10;
  return 20;
}

/**
 * @param {object} scenario  validated scenario
 * @param {object} result    simulate() output
 * @param {{ lanes?: boolean, label: string, hero?: boolean }} opts
 */
export function miniHtml(scenario, result, { lanes = false, label, hero = false }) {
  const T = result.summary.makespan;
  if (T > 99) throw new Error('mini timelines support up to 99 units');
  const step = rulerStep(T);
  const ticks = [];
  for (let t = 0; t <= T; t += step) ticks.push(`<span class="s-${t}">${t}</span>`);
  // Label the end too, unless it would crowd the last regular label.
  if (T % step && T % step >= step / 2) ticks.push(`<span class="s-${T}">${T}</span>`);

  // Slice boundaries inside one continuous run (Round Robin continuing alone).
  const cuts = [];
  for (let i = 1; i < result.slices.length; i++) {
    const a = result.slices[i - 1];
    const b = result.slices[i];
    if (a.pid && a.pid === b.pid && a.end === b.start) cuts.push(b.start);
  }
  const bar = (seg) => {
    const len = seg.end - seg.start;
    const inner = cuts
      .filter((c) => c > seg.start && c < seg.end)
      .map((c) => `<i class="mt b-${c - seg.start}"></i>`)
      .join('');
    const narrow = len / T < 0.06 ? ' narrow' : '';
    return `<div class="mb c${slot(seg.pid)} s-${seg.start} l-${len}${narrow}" data-label="${seg.pid}"><div class="mf"><span class="mfl">${seg.pid}</span></div>${inner}</div>`;
  };
  const idle = (seg) => `<div class="mi s-${seg.start} l-${seg.end - seg.start}"><span>idle</span></div>`;

  const cpu = result.segments.map((s) => (s.pid ? bar(s) : idle(s))).join('');
  const rows = [`<div class="mini-lane cpu"><span class="mini-name">CPU</span><div class="mini-track">${cpu}</div></div>`];
  if (lanes) {
    for (const p of scenario.processes) {
      const own = result.segments.filter((s) => s.pid === p.id);
      const parts = [];
      let from = p.arrival;
      for (const s of own) {
        if (s.start > from) parts.push(`<i class="mw c${slot(p.id)} s-${from} l-${s.start - from}"></i>`);
        parts.push(bar(s));
        from = s.end;
      }
      rows.push(
        `<div class="mini-lane"><span class="mini-name"><i class="swatch c${slot(p.id)}"></i>${p.id}</span><div class="mini-track">${parts.join('')}</div></div>`,
      );
    }
  }
  const summary = result.segments.map((s) => (s.pid ? `${s.pid} runs ${s.start} to ${s.end}` : `idle ${s.start} to ${s.end}`)).join(', ');
  return `<div class="mini T-${T}${hero ? ' mini-hero' : ''}"${hero ? ' data-hero' : ''} data-t="${T}" role="img" aria-label="${label}: ${summary}.">
  <div class="mini-ruler" aria-hidden="true"><span class="mini-name"></span><div class="mini-ticks">${ticks.join('')}</div></div>
  ${rows.join('\n  ')}
  <div class="mini-head" aria-hidden="true"><div class="mini-line"></div></div>
</div>`;
}

/** Utility classes for mini timelines, appended to the stylesheet by the build. */
export function miniUtilityCss(max = 99) {
  const out = [];
  for (let n = 0; n <= max; n++) out.push(`.s-${n}{--s:${n}}`, `.b-${n}{--b:${n}}`);
  for (let n = 1; n <= max; n++) out.push(`.l-${n}{--len:${n}}`, `.T-${n}{--T:${n}}`);
  for (let i = 1; i <= 8; i++) out.push(`.c${i}{--c:var(--c${i});--on:var(--on-c${i})}`);
  return out.join('');
}

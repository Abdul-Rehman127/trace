// Inline SVG icons built through DOM APIs. 2 px strokes on a 24 unit grid.
import { svg } from './dom.mjs';

const base = (size, children, stroke = true) =>
  svg(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: stroke ? 'none' : 'currentColor',
      stroke: stroke ? 'currentColor' : null,
      'stroke-width': stroke ? 2 : null,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    children,
  );

export const iconClose = (size = 18) => base(size, [svg('path', { d: 'M6 6l12 12M18 6L6 18' })]);
export const iconCheck = (size = 16) => base(size, [svg('path', { d: 'M5 12.5l4.5 4.5L19 7.5' })]);

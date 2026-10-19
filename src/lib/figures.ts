/**
 * Illustrative placeholder "figures" for publications that have no supplied figure.
 * They are deliberately generic shapes — NOT research data — and are labelled as such
 * wherever they appear. Deterministic so server and client render the same thing.
 */
export type FigureKind = 'decay' | 'spectrum' | 'rings' | 'scatter' | 'field';

export interface FigureGeometry {
  /** Polylines in a 0..1 unit square (y up). */
  lines: { points: [number, number][]; weight: number; dashed?: boolean }[];
  dots: [number, number][];
}

function rand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function figureGeometry(kind: FigureKind, seed = 1): FigureGeometry {
  const r = rand(seed * 97 + 13);
  const lines: FigureGeometry['lines'] = [];
  const dots: [number, number][] = [];
  const N = 120;
  const xs = Array.from({ length: N }, (_, i) => i / (N - 1));

  if (kind === 'decay') {
    for (const k of [3, 5, 8]) {
      lines.push({ points: xs.map((x) => [x, 0.08 + 0.82 * Math.exp(-k * x) * (0.5 + 0.5 * Math.cos(x * 22))]), weight: k === 5 ? 1.4 : 0.8 });
    }
    for (let i = 0; i < 26; i++) {
      const x = i / 25;
      dots.push([x, 0.08 + 0.82 * Math.exp(-5 * x) * (0.5 + 0.5 * Math.cos(x * 22)) + (r() - 0.5) * 0.05]);
    }
  } else if (kind === 'spectrum') {
    const peaks = [0.22, 0.47, 0.51, 0.73];
    lines.push({
      points: xs.map((x) => [x, 0.08 + peaks.reduce((s, p, i) => s + (0.75 - i * 0.1) * Math.exp(-(((x - p) / 0.012) ** 2)), 0) + 0.04 * r()]),
      weight: 1,
    });
    lines.push({ points: xs.map((x) => [x, 0.08 + 0.1 * Math.exp(-(((x - 0.5) / 0.3) ** 2))]), weight: 0.7, dashed: true });
  } else if (kind === 'rings') {
    for (let k = 1; k <= 9; k++) {
      const rad = 0.06 * Math.sqrt(k) * 2;
      lines.push({
        points: Array.from({ length: 73 }, (_, i) => {
          const a = (i / 72) * Math.PI * 2;
          return [0.5 + rad * Math.cos(a), 0.5 + rad * 0.92 * Math.sin(a)] as [number, number];
        }),
        weight: k % 3 === 0 ? 1.3 : 0.7,
      });
    }
  } else if (kind === 'scatter') {
    for (let i = 0; i < 260; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(-2 * Math.log(r() + 1e-6)) * 0.13;
      dots.push([0.5 + d * Math.cos(a) * 1.3, 0.5 + d * Math.sin(a)]);
    }
    lines.push({ points: xs.map((x) => [x, 0.5 + 0.28 * Math.exp(-(((x - 0.5) / 0.18) ** 2)) - 0.14]), weight: 1.2 });
  } else {
    // field: dipole-like equipotential sketch
    for (const c of [0.12, 0.2, 0.3, 0.45, 0.65]) {
      for (const sgn of [-1, 1]) {
        const pts: [number, number][] = [];
        for (let i = 0; i <= 90; i++) {
          const a = (i / 90) * Math.PI * 2;
          const rad = c * (1 + 0.55 * Math.cos(a));
          pts.push([0.5 + sgn * (0.16 + rad * 0.5 * Math.cos(a) * sgn), 0.5 + rad * 0.55 * Math.sin(a)]);
        }
        lines.push({ points: pts, weight: c === 0.3 ? 1.2 : 0.6 });
      }
    }
  }
  return { lines, dots };
}

/** SVG markup for the static (detail page / fallback) rendering. */
export function figureSvg(kind: FigureKind, seed = 1, stroke = '#2a2a28'): string {
  const g = figureGeometry(kind, seed);
  const S = 400;
  const P = 36;
  const tx = (x: number) => (P + x * (S - 2 * P)).toFixed(1);
  const ty = (y: number) => (S - P - y * (S - 2 * P)).toFixed(1);
  const axes = `<path d="M${P} ${P - 8}V${S - P}H${S - P + 8}" fill="none" stroke="${stroke}" stroke-width="1"/>`;
  const ticks = Array.from({ length: 6 }, (_, i) => {
    const t = P + (i * (S - 2 * P)) / 5;
    return `<path d="M${t} ${S - P}v5M${P} ${t}h-5" stroke="${stroke}" stroke-width="0.8"/>`;
  }).join('');
  const lines = g.lines
    .map(
      (l) =>
        `<polyline fill="none" stroke="${stroke}" stroke-width="${l.weight}" ${l.dashed ? 'stroke-dasharray="4 4"' : ''} points="${l.points
          .map(([x, y]) => `${tx(x)},${ty(y)}`)
          .join(' ')}"/>`,
    )
    .join('');
  const dots = g.dots.map(([x, y]) => `<circle cx="${tx(x)}" cy="${ty(y)}" r="1.6" fill="${stroke}"/>`).join('');
  return `<svg viewBox="0 0 ${S} ${S}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustrative placeholder graphic, not research data">${axes}${ticks}${lines}${dots}</svg>`;
}

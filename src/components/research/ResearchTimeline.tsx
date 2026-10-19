import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './research.css';

export interface ResearchItem {
  id: string;
  year: number;
  title: string;
  caption: string;
  location?: string;
  href: string;
  alt: string;
  demo: boolean;
  image: { src: string; srcSet: string; width: number; height: number };
}

interface Props {
  items: ResearchItem[]; // already sorted newest → oldest
  sizes: string;
}

/** Scroll travel per project transition, as a fraction of the viewport height. */
const STEP_VH = 0.55;
/** Dwell at the start and end of the sequence. */
const HOLD_VH = 0.22;
/** Angular spacing of years on the drum. */
const STEP_DEG = 34;

const SCROLL_MQ = '(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)';
const REDUCE_MQ = '(prefers-reduced-motion: reduce)';

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Position of year label i on the drum when the drum is at continuous year position yp. */
function labelStyle(i: number, yp: number) {
  const deg = -(i - yp) * STEP_DEG;
  const c = Math.cos((deg * Math.PI) / 180);
  const vis = Math.abs(deg) < 84;
  const opacity = vis ? +Math.pow(clamp((c - 0.18) / 0.82, 0, 1), 1.7).toFixed(3) : 0;
  return {
    // --R (drum radius) is defined in CSS so the server render already has the final geometry.
    transform: `translateY(-50%) translateZ(calc(var(--R) * -1)) rotateX(${deg.toFixed(2)}deg) translateZ(var(--R))`,
    opacity,
    visibility: (vis ? 'visible' : 'hidden') as 'visible' | 'hidden',
  };
}

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function ResearchTimeline({ items, sizes }: Props) {
  const years = useMemo(() => Array.from(new Set(items.map((i) => i.year))), [items]);
  const yearIndexOf = useMemo(() => items.map((i) => years.indexOf(i.year)), [items, years]);
  const firstOfYear = useMemo(() => years.map((y) => items.findIndex((i) => i.year === y)), [items, years]);
  const n = items.length;

  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<'scroll' | 'static'>('scroll');
  const [missing, setMissing] = useState<Record<string, boolean>>({});

  const trackRef = useRef<HTMLDivElement>(null);
    const labelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const posRef = useRef(0);
  const activeRef = useRef(0);
  const stRef = useRef<ScrollTrigger | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  /** Continuous project position → continuous year position on the drum. */
  const yearPos = useCallback(
    (p: number) => {
      const a = Math.floor(p);
      const b = Math.min(n - 1, a + 1);
      const f = p - a;
      return yearIndexOf[a] + (yearIndexOf[b] - yearIndexOf[a]) * f;
    },
    [n, yearIndexOf],
  );

  const render = useCallback(
    (p: number) => {
      posRef.current = p;
      const yp = yearPos(p);
      labelRefs.current.forEach((el, i) => {
        if (!el) return;
        const st = labelStyle(i, yp);
        el.style.transform = st.transform;
        el.style.opacity = String(st.opacity);
        el.style.visibility = st.visibility;
      });
      const idx = clamp(Math.round(p), 0, n - 1);
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
    },
    [n, yearPos],
  );

  // Decide mode from the same media query the CSS uses.
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia(SCROLL_MQ);
    const set = () => setMode(mq.matches ? 'scroll' : 'static');
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  // Scroll-linked mode: the page scroll is the only driver; no wheel capture, no nested scrolling.
  useEffect(() => {
    render(posRef.current);
    if (mode !== 'scroll' || !trackRef.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const headerH = () => (document.querySelector('[data-header]') as HTMLElement | null)?.offsetHeight ?? 0;
    const st = ScrollTrigger.create({
      trigger: trackRef.current,
      start: () => `top top+=${headerH()}`,
      end: 'bottom bottom',
      onUpdate: (self) => {
        tweenRef.current?.kill();
        const vh = window.innerHeight;
        const px = self.scroll() - self.start;
        render(clamp((px - HOLD_VH * vh) / (STEP_VH * vh), 0, n - 1));
      },
      onRefresh: (self) => {
        const vh = window.innerHeight;
        const px = self.scroll() - self.start;
        render(clamp((px - HOLD_VH * vh) / (STEP_VH * vh), 0, n - 1));
      },
    });
    stRef.current = st;
    return () => {
      st.kill();
      stRef.current = null;
    };
  }, [mode, n, render]);

  /** Jump to project k: in scroll mode by moving the page, otherwise by turning the drum. */
  const goTo = useCallback(
    (k: number) => {
      k = clamp(k, 0, n - 1);
      const reduce = window.matchMedia(REDUCE_MQ).matches;
      const st = stRef.current;
      if (mode === 'scroll' && st) {
        const vh = window.innerHeight;
        const top = st.start + HOLD_VH * vh + k * STEP_VH * vh + 1;
        window.scrollTo({ top, behavior: reduce ? 'instant' : 'smooth' } as ScrollToOptions);
        return;
      }
      tweenRef.current?.kill();
      if (reduce) {
        render(k);
        return;
      }
      const proxy = { p: posRef.current };
      tweenRef.current = gsap.to(proxy, {
        p: k,
        duration: 0.55 + 0.12 * Math.abs(k - posRef.current),
        ease: 'power2.inOut',
        onUpdate: () => render(proxy.p),
      });
    },
    [mode, n, render],
  );

  const activeYearIdx = yearIndexOf[active];

  const onYearKey = (e: KeyboardEvent<HTMLButtonElement>, j: number) => {
    let next = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = Math.min(years.length - 1, j + 1);
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = Math.max(0, j - 1);
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = years.length - 1;
    if (next < 0) return;
    e.preventDefault();
    goTo(firstOfYear[next]);
    labelRefs.current[next]?.focus({ preventScroll: true });
  };

  const sameYear = items.filter((i) => i.year === items[active].year);
  const posInYear = sameYear.findIndex((i) => i.id === items[active].id);

  return (
    <div
      ref={trackRef}
      className={`rt rt--${mode}`}
      style={{ ['--travel' as string]: `${((n - 1) * STEP_VH + 2 * HOLD_VH) * 100}vh` }}
    >
      <div className="rt__stage">
        <div className="rt__grid wrap">
            <div className="rt__frame" style={{ aspectRatio: `${items[0].image.width} / ${items[0].image.height}` }}>
              {items.map((item, i) => (
                <a
                  key={item.id}
                  href={item.href}
                  className={`rt__photo${i === active ? ' is-active' : ''}`}
                  aria-hidden={i !== active}
                  tabIndex={i === active ? 0 : -1}
                  aria-label={`${item.title}, ${item.year} — open project`}
                >
                  {missing[item.id] ? (
                    <span className="img-missing">{item.alt}</span>
                  ) : (
                    <img
                      src={item.image.src}
                      srcSet={item.image.srcSet}
                      sizes={sizes}
                      width={item.image.width}
                      height={item.image.height}
                      alt={item.alt}
                      loading={i < 2 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      onError={() => setMissing((m) => ({ ...m, [item.id]: true }))}
                    />
                  )}
                </a>
              ))}
            </div>

            <div className="rt__caption-row">
              <div className="rt__captions">
                {items.map((item, i) => (
                  <div key={item.id} className={`rt__caption${i === active ? ' is-active' : ''}`} aria-hidden={i !== active}>
                    <p className="label rt__section">01 — Research</p>
                    <h3 className="rt__title">
                      <a href={item.href} tabIndex={i === active ? 0 : -1} className="link-underline">
                        {item.title}
                      </a>
                      {item.demo && <span className="demo-tag" title="Demonstration content">Demo</span>}
                    </h3>
                    <p className="meta">
                      {item.caption}
                      {item.location ? ` / ${item.location}` : ''} / {item.year}
                      {sameYear.length > 1 && i === active ? `  ·  ${posInYear + 1} of ${sameYear.length} this year` : ''}
                    </p>
                  </div>
                ))}
              </div>
              {mode === 'static' && n > 1 && (
                <div className="rt__step meta">
                  <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0}>
                    ← Newer
                  </button>
                  <span aria-hidden="true">
                    {String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
                  </span>
                  <button type="button" onClick={() => goTo(active + 1)} disabled={active === n - 1}>
                    Older →
                  </button>
                </div>
              )}
            </div>

            <div className="rt__drum" role="group" aria-label="Research by year">
              <span className="rt__glass" aria-hidden="true" />
              {years.map((y, j) => (
                <button
                  key={y}
                  type="button"
                  ref={(el) => {
                    labelRefs.current[j] = el;
                  }}
                  className={`rt__year${j === activeYearIdx ? ' is-active' : ''}`}
                  aria-current={j === activeYearIdx ? 'true' : undefined}
                  aria-label={`${y}${j === activeYearIdx ? ', selected' : ''}`}
                  tabIndex={j === activeYearIdx ? 0 : -1}
                  onClick={() => goTo(firstOfYear[j])}
                  onKeyDown={(e) => onYearKey(e, j)}
                  style={labelStyle(j, 0)}
                >
                  {y}
                </button>
              ))}
            </div>
            <p className="meta rt__aside">Selected experiments, over time</p>
        </div>
      </div>
    </div>
  );
}

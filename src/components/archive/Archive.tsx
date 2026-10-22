import { t as tr, type Lang } from '@/i18n/ui';
import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import type { FigureKind } from '@/lib/figures';
import './archive.css';

export interface ArchivePaper {
  id: string;
  number: string; // "01"
  title: string;
  year: number;
  venue: string;
  summary: string;
  href: string;
  figureKind: FigureKind;
  /** Optimised URL of the paper's own figure, printed on the dossier when present. */
  figureSrc?: string;
  demo: boolean;
}

interface Props {
  papers: ArchivePaper[];
  indexHref: string;
  lang?: Lang;
}

const ArchiveScene = lazy(() => import('./ArchiveScene'));

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Static drawing used when WebGL is unavailable or the scene fails. Decorative only. */
function ArchiveFallback({ papers, active }: { papers: ArchivePaper[]; active: number | null }) {
  return (
    <svg className="ar__fallback" viewBox="0 0 600 420" aria-hidden="true">
      {papers.map((p, i) => {
        const x = 150 + i * 46;
        const y = 70 + i * 16 - (active === i ? 18 : 0);
        return (
          <g key={p.id} style={{ transition: 'transform 300ms' }}>
            <rect x={x} y={y + 22} width="230" height="230" fill="#efe9db" stroke="#cfc8b8" />
            <rect x={x + 10 + i * 18} y={y} width="44" height="24" fill="#1b1b1a" />
            <text x={x + 32 + i * 18} y={y + 17} textAnchor="middle" fontFamily="monospace" fontSize="12" fill="#f8f8f5">
              {p.number}
            </text>
          </g>
        );
      })}
      <path d="M90 230 L470 230 L520 300 L140 300 Z" fill="#cbc6bd" />
      <rect x="140" y="300" width="380" height="96" fill="#bdb8af" />
      <path d="M90 230 L140 300 L140 396 L90 320 Z" fill="#a9a49b" />
      <rect x="290" y="330" width="80" height="30" fill="none" stroke="#6f6f6c" strokeWidth="3" />
    </svg>
  );
}

export default function Archive({ papers, indexHref, lang = 'en' }: Props) {
  const t = tr(lang);
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [near, setNear] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWebgl(hasWebGL());
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const current = active !== null ? papers[active] : null;
  const fallback = <ArchiveFallback papers={papers} active={active} />;

  return (
    <div className="ar">
      <div className="ar__stage" ref={stageRef}>
        {webgl === false && fallback}
        {webgl && near && (
          <SceneBoundary fallback={fallback}>
            <Suspense fallback={null}>
              <div className={`ar__canvas${ready ? ' is-ready' : ''}`} aria-hidden="true">
                <ArchiveScene
                  papers={papers}
                  active={active}
                  onActive={setActive}
                  onOpen={(i) => window.location.assign(papers[i].href)}
                  onReady={() => setReady(true)}
                />
              </div>
            </Suspense>
          </SceneBoundary>
        )}
      </div>

      <div className="ar__side">
        <ol className="ar__index" aria-label={t.archive.indexLabel}>
          {papers.map((p, i) => (
            <li key={p.id}>
              <a
                href={p.href}
                className={active === i ? 'is-active' : undefined}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((a) => (a === i ? null : a))}
                onFocus={() => setActive(i)}
                onBlur={() => setActive((a) => (a === i ? null : a))}
              >
                <span className="ar__num">{p.number}</span>
                <span className="ar__index-title">{p.title}</span>
                <span className="ar__index-year">{p.year}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className="ar__caption">
        <div className="ar__caption-body" aria-live="polite">
        {current ? (
          <>
            <p className="label ar__caption-kicker">
              {t.archive.file} {current.number} {current.demo && <span className="demo-tag">Demo</span>}
            </p>
            <p className="ar__caption-title">{current.title}</p>
            <p className="meta">
              {current.year} / {current.venue}
            </p>
            <p className="meta ar__caption-summary">{current.summary}</p>
            <p className="meta ar__caption-hint">{t.archive.hint}</p>
          </>
        ) : (
          <>
            <p className="label ar__caption-kicker">{t.archive.selected}</p>
            <p className="meta ar__caption-summary">
              {t.archive.intro}
            </p>
          </>
        )}
        </div>
        <a className="ar__all label link-underline tap" href={indexHref}>
          {t.archive.viewAll}
        </a>
      </div>
    </div>
  );
}

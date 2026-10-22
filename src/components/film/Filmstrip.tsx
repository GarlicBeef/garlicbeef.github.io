import { t as tr, type Lang } from '@/i18n/ui';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Noise from '../reactbits/Noise';
import './film.css';

export interface FilmNote {
  id: string;
  frame: number;
  title: string;
  date: string; // display
  iso: string;
  location?: string;
  href: string;
  alt: string;
  position: string;
  demo: boolean;
  image: { src: string; srcSet: string; width: number; height: number };
}

interface Props {
  notes: FilmNote[];
  lang?: Lang;
}

/** Pixels per second at full speed. */
const SPEED = 26;
const AUTO_MQ = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (min-width: 720px)';
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function Frame({
  note,
  clone,
  onEnter,
  onLeave,
  missing,
  onMissing,
}: {
  note: FilmNote;
  clone: boolean;
  onEnter: (id: string, el: HTMLElement) => void;
  onLeave: () => void;
  missing: boolean;
  onMissing: (id: string) => void;
}) {
  const label = `${note.title} — ${note.date}${note.location ? `, ${note.location}` : ''}`;
  return (
    <li className="fs__frame" data-id={note.id} aria-hidden={clone || undefined} inert={clone || undefined}>
      <a
        href={note.href}
        className="fs__link"
        tabIndex={clone ? -1 : 0}
        aria-label={clone ? undefined : label}
        draggable={false}
        onPointerEnter={(e) => e.pointerType === 'mouse' && onEnter(note.id, e.currentTarget)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && onLeave()}
        onFocus={(e) => onEnter(note.id, e.currentTarget)}
        onBlur={onLeave}
      >
        <span className="fs__film">
          <span className="fs__edge fs__edge--top mono" aria-hidden="true">
            <span>{String(note.frame).padStart(2, '0')}</span>
            <span className="fs__edge-mark">▸ {String(note.frame).padStart(2, '0')}A</span>
          </span>
          <span className="fs__img">
            {missing ? (
              <span className="img-missing">{note.alt}</span>
            ) : (
              <img
                src={note.image.src}
                srcSet={note.image.srcSet}
                sizes="(max-width: 720px) 72vw, 420px"
                width={note.image.width}
                height={note.image.height}
                alt={clone ? '' : note.alt}
                loading="lazy"
                decoding="async"
                draggable={false}
                style={{ objectPosition: note.position }}
                onError={() => onMissing(note.id)}
              />
            )}
          </span>
          <span className="fs__edge fs__edge--bottom mono" aria-hidden="true">
            <span>{String(note.frame).padStart(2, '0')}</span>
            <span className="fs__edge-mark">{String(note.frame).padStart(2, '0')}A ◂</span>
          </span>
        </span>
        <span className="fs__inline-caption meta" aria-hidden="true">
          <span className="fs__inline-title"><span className="fs__inline-num">{String(note.frame).padStart(2, '0')}</span>{note.title}</span>
          <span>
            {note.date}
            {note.location ? ` / ${note.location}` : ''}
          </span>
        </span>
      </a>
    </li>
  );
}

export default function Filmstrip({ notes, lang = 'en' }: Props) {
  const t = tr(lang);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [auto, setAuto] = useState(false);
  const [copies, setCopies] = useState(1);
  const [hover, setHover] = useState<{ id: string; x: number } | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [missing, setMissing] = useState<Record<string, boolean>>({});

  const x = useRef(0);
  const speed = useRef(1); // 0..1, eased
  const setWidth = useRef(1);
  const hoverRef = useRef(false);
  const pausedRef = useRef(false);
  const drag = useRef({ active: false, moved: false, startX: 0, startOffset: 0, id: -1 });
  const suppressClick = useRef(false);

  pausedRef.current = userPaused;

  // Mode: automatic movement only with a fine pointer, hover, enough width and motion allowed.
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia(AUTO_MQ);
    const set = () => setAuto(mq.matches);
    set();
    mq.addEventListener('change', set);
    return () => mq.removeEventListener('change', set);
  }, []);

  const wrap = (v: number) => {
    const w = setWidth.current;
    return ((((v % w) + w) % w) - w) % w; // (-w, 0]
  };

  const apply = () => {
    if (trackRef.current) trackRef.current.style.transform = `translate3d(${x.current.toFixed(2)}px,0,0)`;
  };

  // Measure one set and decide how many clones are needed to cover the viewport.
  useEffect(() => {
    if (!auto) {
      setCopies(1);
      if (trackRef.current) trackRef.current.style.transform = '';
      return;
    }
    const measure = () => {
      const track = trackRef.current;
      const vp = viewportRef.current;
      if (!track || !vp) return;
      const frames = track.querySelectorAll<HTMLElement>('.fs__frame');
      const first = frames[0];
      const firstClone = frames[notes.length];
      const w = firstClone ? firstClone.offsetLeft - first.offsetLeft : track.scrollWidth;
      setWidth.current = Math.max(1, w);
      const needed = 1 + Math.ceil((vp.clientWidth * 1.5) / setWidth.current);
      setCopies((c) => (c === needed ? c : needed));
      x.current = wrap(x.current);
      apply();
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [auto, copies, notes.length]);

  // Touch / manual mode has no hover, so the frame that has settled into view "develops"
  // from grey to colour instead: the most visible frame, once the strip is on screen.
  useEffect(() => {
    if (auto) return;
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track) return;
    let onScreen = false;
    let raf = 0;
    const update = () => {
      raf = 0;
      const frames = Array.from(track.querySelectorAll<HTMLElement>('.fs__frame'));
      const v = vp.getBoundingClientRect();
      let best: HTMLElement | null = null;
      let bestSeen = 0;
      for (const f of frames) {
        const r = f.getBoundingClientRect();
        const seen = Math.max(0, Math.min(r.right, v.right) - Math.max(r.left, v.left)) / Math.max(1, r.width);
        if (seen > bestSeen + 0.01) {
          best = f;
          bestSeen = seen;
        }
      }
      frames.forEach((f) => f.classList.toggle('is-focus', onScreen && f === best && bestSeen > 0.6));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(
      (e) => {
        onScreen = e.some((i) => i.isIntersecting);
        schedule();
      },
      { threshold: 0.6 },
    );
    io.observe(vp);
    vp.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      io.disconnect();
      vp.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
      track.querySelectorAll('.fs__frame.is-focus').forEach((f) => f.classList.remove('is-focus'));
    };
  }, [auto, notes.length]);

  // Steady motion via GSAP's ticker; only while on screen.
  useEffect(() => {
    if (!auto) return;
    let visible = false;
    const io = new IntersectionObserver((e) => (visible = e.some((i) => i.isIntersecting)));
    if (viewportRef.current) io.observe(viewportRef.current);
    const tick = (_t: number, dt: number) => {
      if (!visible || drag.current.active) return;
      const target = hoverRef.current || pausedRef.current ? 0 : 1;
      speed.current += (target - speed.current) * Math.min(1, dt / 180);
      if (Math.abs(target - speed.current) < 0.002) speed.current = target;
      if (speed.current === 0) return;
      x.current = wrap(x.current - (SPEED * speed.current * dt) / 1000);
      apply();
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
    };
  }, [auto]);

  const onEnter = useCallback(
    (id: string, el: HTMLElement) => {
      hoverRef.current = true;
      const vp = viewportRef.current;
      if (!vp) return;
      let r = el.getBoundingClientRect();
      const vr = vp.getBoundingClientRect();
      // Keyboard focus may land on a frame outside the visible strip: bring it into view.
      if (auto && (r.left < vr.left + 24 || r.right > vr.right - 24)) {
        const target = vr.left + vr.width / 2 - r.width / 2;
        x.current = wrap(x.current + (target - r.left));
        apply();
        r = el.getBoundingClientRect();
      }
      setHover({ id, x: r.left - vr.left + r.width / 2 });
    },
    [auto],
  );
  const onLeave = useCallback(() => {
    hoverRef.current = false;
    setHover(null);
  }, []);

  // Dragging (auto mode only; touch mode uses native horizontal scrolling).
  const onPointerDown = (e: React.PointerEvent) => {
    if (!auto || e.button !== 0) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startOffset: x.current, id: e.pointerId };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active || e.pointerId !== d.id) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (d.moved) {
      x.current = wrap(d.startOffset + dx);
      apply();
      setHover(null);
    }
  };
  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.moved) {
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 0);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
    }
    setDragging(false);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  };

  const hovered = hover ? notes.find((n) => n.id === hover.id) : null;
  const vpWidth = viewportRef.current?.clientWidth ?? 0;
  const capX = hover ? Math.min(Math.max(hover.x, 140), Math.max(140, vpWidth - 140)) : 0;

  const sets = auto ? copies : 1;

  return (
    <div className={`fs${auto ? ' fs--auto' : ' fs--manual'}${dragging ? ' is-dragging' : ''}`}>
      <div
        ref={viewportRef}
        className="fs__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        <ul ref={trackRef} className="fs__track" aria-label={t.notes.strip}>
          {Array.from({ length: sets }, (_, s) =>
            notes.map((n) => (
              <Frame
                key={`${s}-${n.id}`}
                note={n}
                clone={s > 0}
                onEnter={onEnter}
                onLeave={onLeave}
                missing={!!missing[n.id]}
                onMissing={(id) => setMissing((m) => ({ ...m, [id]: true }))}
              />
            )),
          )}
        </ul>
        <Noise opacity={0.07} fps={12} size={1.2} blendMode="overlay" contrast={0.5} className="fs__grain" />
      </div>

      <div className="fs__below">
        <p className="fs__caption meta" aria-hidden={!hovered} style={{ left: capX }}>
          {hovered && (
            <>
              <span className="fs__caption-title">{hovered.title}</span>
              <span>
                <time dateTime={hovered.iso}>{hovered.date}</time>
                {hovered.location ? ` / ${hovered.location}` : ''}
              </span>
            </>
          )}
        </p>
        {auto && (
          <div className="fs__controls meta">
            <span className="fs__hint" aria-hidden="true">
              {t.notes.drag}
            </span>
            <button type="button" className="fs__toggle" aria-pressed={userPaused} onClick={() => setUserPaused((p) => !p)}>
              {userPaused ? t.notes.resume : t.notes.pause}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

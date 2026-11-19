// The smaller pieces of the TV: the background, the jelly timer jar, the big shouts, confetti, the logo and the podium.
import { useLayoutEffect, useRef } from 'react';
import { FPS, FUN, H, INK, LEMON, W, WORD, BOUNCY, JELLY, fitSize, rand, ramp, shade, sp } from './util';

/** The floor starts here on every screen, so the page around the game can carry it on past the edges. */
export const FLOOR_TOP = 850;
export const floorColor = (tint: string) => shade(tint, 0.78);

/** Pale lilac with sprinkles that drift very slowly, and a soft jelly floor where the pals stand. */
export function Background({ frame, reduce, tint }: { frame: number; reduce: boolean; tint: string }) {
  const t = frame / FPS;
  const sprinkles = Array.from({ length: 22 }, (_, i) => {
    const x = rand(i) * W, y = rand(i + 50) * H * 0.7;
    const c = ['#FFC2DE', '#BDE3FF', '#FFF0A0', '#C8F2D9', '#DCCBFF', '#FFD6BF'][i % 6];
    const dy = reduce ? 0 : Math.sin(t * 0.5 + i) * 12;
    const r = 14 + rand(i + 9) * 26;
    const pill = i % 3 === 0;
    return <div key={i} style={{ position: 'absolute', left: x, top: y + dy, width: pill ? r * 2.2 : r, height: r, borderRadius: 999, background: c,
      transform: `rotate(${rand(i + 3) * 180 + (reduce ? 0 : t * 4 * (i % 2 ? 1 : -1))}deg)` }} />;
  });
  return (
    <div data-tv-scene style={{ position: 'absolute', inset: 0, background: '#EFE7FF', overflow: 'hidden' }}>
      {sprinkles}
      <div style={{ position: 'absolute', left: 0, right: 0, top: FLOOR_TOP, bottom: 0, background: floorColor(tint), boxShadow: `inset 0 14px 0 ${shade(tint, 0.62)}` }} />
      {/* A gentle hump in the middle of the floor; only its top shows above the flat floor. */}
      <div style={{ position: 'absolute', left: 240, right: 240, top: FLOOR_TOP - 56, height: 72, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 260, borderRadius: '50%', background: floorColor(tint),
          boxShadow: `inset 0 14px 0 ${shade(tint, 0.62)}` }} />
      </div>
    </div>
  );
}

/** The timer: a round jar of jelly that drains as time runs out, with a sloshing top (after Bencho's slosh block). */
export function Jar({ left, total, color, frame, reduce, popLocal }: { left: number; total: number; color: string; frame: number; reduce: boolean; popLocal: number }) {
  const p = Math.max(0, Math.min(1, left / Math.max(1, total)));
  const hot = left <= 5000, warn = left <= 10000;
  const fill = hot ? '#FF5A5F' : color;
  const size = 210;
  const t = frame / FPS;
  const wave = reduce ? 0 : (t * 120) % 200;
  const shake = warn && !reduce ? Math.sin(t * (hot ? 40 : 22)) * (hot ? 4 : 2) : 0;
  const pop = 1 + 0.35 * (1 - sp(popLocal, reduce, JELLY)) * (popLocal >= 0 && popLocal < 60 ? 1 : 0);
  const secs = Math.ceil(left / 1000);
  const text = secs >= 60 ? `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` : String(secs);
  return (
    <div style={{ position: 'absolute', right: 56, top: 40, width: size, height: size, transform: `rotate(${shake}deg)` }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `12px solid ${INK}`, background: '#fff', overflow: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${p * 100}%`, background: fill }}>
          <svg viewBox="0 0 400 24" preserveAspectRatio="none" style={{ position: 'absolute', top: -20, left: -wave, width: 400, height: 24 }}>
            <path d="M0 12 Q25 0 50 12 T100 12 T150 12 T200 12 T250 12 T300 12 T350 12 T400 12 V24 H0Z" fill={fill} />
          </svg>
          <div style={{ position: 'absolute', left: 24, top: 18, width: 26, height: 14, borderRadius: 99, background: 'rgba(255,255,255,.45)' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', transform: `scale(${pop})`,
        font: `400 ${text.length > 2 ? 72 : 96}px/1 ${FUN}`, color: INK, WebkitTextStroke: '10px #fff', paintOrder: 'stroke fill' }}>{text}</div>
    </div>
  );
}

/** A big outlined shout that bounces in: countdown numbers, GO!, TIME'S UP!, a team's name. It shrinks to fit the screen. */
export function Shout({ text, local, reduce, color = LEMON, size: want = 320, y = 470 }: { text: string; local: number; reduce: boolean; color?: string; size?: number; y?: number }) {
  const size = fitSize(text, 400, FUN, W - 200, want);
  const s = sp(local, reduce, JELLY);
  const sx = reduce ? 1 : s * (1 + 0.15 * Math.sin(local / 3) * Math.exp(-local / 20));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, transform: `translateY(-50%) scale(${sx}, ${s})`, textAlign: 'center',
      font: `400 ${size}px/1 ${FUN}`, color, WebkitTextStroke: `${size / 26}px ${INK}`, paintOrder: 'stroke fill', textShadow: `0 ${size / 18}px 0 ${INK}`, whiteSpace: 'nowrap' }}>{text}</div>
  );
}

/** A friendly pill of plain text. */
export function Pill({ text, y, local, reduce }: { text: string; y: number; local: number; reduce: boolean }) {
  const s = sp(local, reduce, BOUNCY);
  return (
    <div style={{ position: 'absolute', left: '50%', top: y, transform: `translate(-50%, ${(1 - s) * 60}px)`, opacity: Math.min(1, s * 1.5),
      font: `800 46px/1.15 ${WORD}`, color: INK, background: '#fff', padding: '18px 44px', borderRadius: 999, border: `6px solid ${INK}`, whiteSpace: 'nowrap' }}>{text}</div>
  );
}

/** HEADS UP! in jelly letters that bounce one after another. */
export function Logo({ frame, reduce, y = 300 }: { frame: number; reduce: boolean; y?: number }) {
  const letters = [...'HEADS UP!'];
  const colors = ['#FF5A36', '#FF6FB1', '#FFB020', '#12B76A', '#2F6BFF', '#8B5CF6'];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', gap: 6 }}>
      {letters.map((ch, i) => {
        const k = reduce ? 0 : ((frame + i * 8) % 150) / 150;
        const hop = k < 0.2 ? Math.sin((k / 0.2) * Math.PI) : 0;
        return <span key={i} style={{ display: 'inline-block', width: ch === ' ' ? 60 : 'auto', transform: `translateY(${-hop * 50}px) rotate(${(i % 2 ? 4 : -4) + hop * 8}deg)`,
          font: `400 230px/1 ${FUN}`, color: colors[i % colors.length], WebkitTextStroke: `11px ${INK}`, paintOrder: 'stroke fill', textShadow: `0 14px 0 ${INK}` }}>{ch}</span>;
      })}
    </div>
  );
}

/** Confetti drawn on a canvas, frame by frame, from seeded random numbers. */
export function Confetti({ local, reduce, kind, seed }: { local: number; reduce: boolean; kind: 'cannons' | 'rain'; seed: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const life = kind === 'rain' ? FPS * 7 : FPS * 3.2;
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, W, H);
    if (reduce || local < 0 || local > life) return;
    const t = local / FPS;
    const colors = ['#FFE45C', '#FF6FB1', '#6CC8FF', '#3DDC97', '#FF8A3D', '#B98CFF', '#FFFFFF'];
    const n = kind === 'rain' ? 240 : 170;
    for (let i = 0; i < n; i++) {
      const r = (k: number) => rand(seed * 1000 + i * 7 + k);
      let x: number, y: number;
      if (kind === 'rain') {
        x = r(1) * W + Math.sin(t * 2 + i) * 30;
        y = -40 - r(2) * H + t * (180 + r(3) * 160);
      } else {
        const left = i % 2 === 0;
        const vx = (left ? 1 : -1) * (300 + r(1) * 700), vy = -(1100 + r(2) * 700);
        x = (left ? 60 : W - 60) + vx * t; y = H + vy * t + 1300 * t * t;
      }
      const s = 14 + r(4) * 16;
      g.save();
      g.translate(x, y);
      g.rotate(r(5) * 6 + t * (4 + r(6) * 6));
      g.fillStyle = colors[i % colors.length];
      g.globalAlpha = Math.min(1, (life - local) / 30);
      if (i % 3 === 0) { g.beginPath(); g.arc(0, 0, s / 2.4, 0, Math.PI * 2); g.fill(); } else g.fillRect(-s / 2, -s / 4, s, s / 2);
      g.restore();
    }
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}

/** The winners' podium: places shared on a tie. */
export function podiumPlaces<T extends { score: number }>(teams: T[]) {
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const placeOf = (t: T) => 1 + ranked.filter(o => o.score > t.score).length;
  return { ranked, placeOf };
}

/** A podium step with its place and the team's name, so a tie still says who tied. */
export function Block({ x, w, h, color, place, name, local, reduce }: { x: number; w: number; h: number; color: string; place: number; name: string; local: number; reduce: boolean }) {
  const s = sp(local, reduce, BOUNCY);
  const nameSize = fitSize(name, 800, WORD, w - 40, 40);
  return (
    <div style={{ position: 'absolute', left: x - w / 2, top: 1000 - h * s, width: w, height: h * s + 20, background: color, borderRadius: '28px 28px 0 0',
      border: `8px solid ${INK}`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingTop: 14, overflow: 'hidden' }}>
      <span style={{ font: `400 72px/1 ${FUN}`, color: '#fff', textShadow: `0 6px 0 ${INK}` }}>{['1st', '2nd', '3rd'][place - 1] ?? `${place}th`}</span>
      <span style={{ font: `800 ${nameSize}px/1.1 ${WORD}`, color: INK, background: '#fff', borderRadius: 999, padding: '6px 14px 2px', whiteSpace: 'nowrap', maxWidth: w - 24 }}>{name}</span>
    </div>
  );
}

export const fadeIn = (local: number) => ramp(local, 0, 12);

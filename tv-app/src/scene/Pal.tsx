// A team's jelly pal: googly eyes that follow the action (after Bencho's eye-tracker block),
// a face for every moment of the turn, and a score that rolls when it changes (after Bencho's rolling counter).
import type { CSSProperties } from 'react';
import { FPS, FUN, INK, WORD, fitSize, rand, shade, sp, BOUNCY, JELLY } from './util';

export type Mood = 'happy' | 'nervous' | 'scared' | 'cheer' | 'sad' | 'gasp' | 'sleep' | 'proud';

export interface PalProps {
  name: string;
  color: string;
  score: number;
  x: number;           // centre of the pal on the canvas
  floor: number;       // y of the ground under the pal
  size: number;        // body width in px
  frame: number;
  seed: number;
  reduce: boolean;
  mood: Mood;
  active?: boolean;
  look: { x: number; y: number };
  lookLocal: number;   // frames since the pal was told where to look
  jumpLocal?: number;  // frames since a big jump started, if any
  hopLocal?: number;   // frames since a small hop started, if any
  waveLocal?: number;  // frames since it started waving, if any
  bump?: { from: number; to: number; local: number };
  crown?: boolean;
  showName?: boolean;
  labelMax?: number;   // widest the name label may be, so neighbours' names never touch
}

function Digits({ value, from, local, reduce, size }: { value: number; from: number; local: number; reduce: boolean; size: number }) {
  const now = String(value);
  const was = String(from).padStart(now.length, ' ');
  return (
    <span style={{ display: 'inline-flex' }}>
      {[...now].map((d, i) => {
        const old = was[i];
        if (old === d || local < 0) return <span key={i} style={{ display: 'inline-block', width: '0.62em', textAlign: 'center' }}>{d}</span>;
        const t = sp(local - i * 4, reduce, BOUNCY);
        return (
          <span key={i} style={{ display: 'inline-block', width: '0.62em', height: size, overflow: 'hidden', position: 'relative', verticalAlign: 'top' }}>
            <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', transform: `translateY(${-t * size}px)`, opacity: 1 - t }}>{old.trim()}</span>
            <span style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', transform: `translateY(${(1 - t) * size}px)` }}>{d}</span>
          </span>
        );
      })}
    </span>
  );
}

export function Pal(p: PalProps) {
  const { size: S, frame, seed, reduce, mood } = p;
  const h = S * 0.88;
  const t = frame / FPS;

  // Body motion: a slow breath, a small hop on each beat, a big jump on a point, a shiver when time is short.
  const breath = reduce ? 0 : Math.sin(t * 2.1 + seed * 1.7) * 0.025;
  let lift = 0;
  let sx = 1 + breath;
  let sy = 1 - breath;
  const jump = (local: number, height: number, dur: number) => {
    if (local < 0 || local > dur || reduce) return;
    const k = local / dur;
    if (k < 0.18) { const q = k / 0.18; sx *= 1 + 0.16 * q; sy *= 1 - 0.18 * q; return; }
    if (k < 0.75) { const q = (k - 0.18) / 0.57; lift += Math.sin(q * Math.PI) * height; sx *= 0.9; sy *= 1.12; return; }
    const q = (k - 0.75) / 0.25; const w = Math.sin(q * Math.PI) * (1 - q);
    sx *= 1 + 0.18 * w; sy *= 1 - 0.2 * w;
  };
  if (p.jumpLocal !== undefined) jump(p.jumpLocal, S * 0.9, 50);
  if (p.hopLocal !== undefined) jump(p.hopLocal, S * 0.25, 26);
  if (mood === 'proud' && !reduce) jump(frame % 70, S * 0.5, 44);
  const shiver = mood === 'scared' && !reduce ? Math.sin(t * 60) * S * 0.015 : 0;
  const sad = mood === 'sad' ? 0.06 : 0;
  sy *= 1 - sad; sx *= 1 + sad;

  // Eyes follow a point with a springy overshoot, and blink now and then.
  const cx = p.x;
  const eyeY = p.floor - h * 0.62 - lift;
  const dx = p.look.x - cx, dy = p.look.y - eyeY;
  const d = Math.hypot(dx, dy) || 1;
  const reach = sp(p.lookLocal, reduce, { damping: 9, stiffness: 160 });
  const pupilMax = S * (mood === 'nervous' || mood === 'scared' ? 0.05 : 0.07);
  const px = (dx / d) * pupilMax * reach, py = (dy / d) * pupilMax * reach;
  const period = Math.round(FPS * (2.6 + rand(seed) * 2.4));
  const blink = !reduce && (frame + Math.round(rand(seed + 9) * period)) % period < 7;
  const closed = mood === 'sleep' || blink;
  const happyEyes = mood === 'cheer' && p.active || mood === 'proud';
  const eyeSize = S * (mood === 'scared' || mood === 'gasp' ? 0.32 : 0.28);
  const pupil = S * (mood === 'scared' ? 0.1 : 0.13);
  const lid = mood === 'sad' ? 0.45 : mood === 'nervous' ? 0.12 : 0;

  const body: CSSProperties = {
    position: 'absolute', left: cx - S / 2 + shiver, top: p.floor - h - lift, width: S, height: h,
    borderRadius: '50% 50% 44% 44% / 62% 62% 38% 38%', background: p.color,
    boxShadow: `inset ${-S * 0.09}px ${-S * 0.1}px 0 ${shade(p.color, -0.18)}, inset ${S * 0.07}px ${S * 0.08}px 0 ${shade(p.color, 0.25)}`,
    transform: `scale(${sx}, ${sy})`, transformOrigin: '50% 100%'
  };
  const eye = (side: -1 | 1): CSSProperties => ({
    position: 'absolute', top: h * 0.2, left: S / 2 + side * (eyeSize / 2 + S * 0.03) - eyeSize / 2, width: eyeSize, height: eyeSize,
    borderRadius: '50%', background: '#fff', border: `${S * 0.025}px solid ${INK}`, overflow: 'hidden', boxSizing: 'border-box'
  });

  let mouth: CSSProperties = { width: S * 0.26, height: S * 0.12, borderBottom: `${S * 0.04}px solid ${INK}`, borderRadius: `0 0 ${S}px ${S}px` };
  if (mood === 'cheer' || mood === 'proud') mouth = { width: S * 0.28, height: S * 0.2, background: INK, borderRadius: `${S * 0.04}px ${S * 0.04}px ${S}px ${S}px` };
  if (mood === 'gasp' || mood === 'scared') mouth = { width: S * 0.13, height: S * 0.16, background: INK, borderRadius: '50%' };
  if (mood === 'sad') mouth = { width: S * 0.22, height: S * 0.09, borderTop: `${S * 0.04}px solid ${INK}`, borderRadius: `${S}px ${S}px 0 0`, marginTop: S * 0.05 };
  if (mood === 'nervous') mouth = { width: S * 0.2, height: 0, borderTop: `${S * 0.04}px solid ${INK}`, borderRadius: 4, marginTop: S * 0.06 };
  if (mood === 'sleep') mouth = { width: S * 0.08, height: S * 0.08, background: INK, borderRadius: '50%', marginTop: S * 0.04 };

  const arm = (side: -1 | 1) => {
    const waving = p.waveLocal !== undefined && p.waveLocal >= 0 && p.waveLocal < FPS * 2.4 && side === 1 && !reduce;
    const up = mood === 'cheer' || mood === 'proud';
    const angle = waving ? -120 + Math.sin(p.waveLocal! / FPS * 14) * 28 : up ? side * -140 + Math.sin(t * 12 + side) * 14 : side * -20;
    return (
      <div style={{ position: 'absolute', top: h * 0.52, left: side === 1 ? S * 0.9 : S * 0.1 - S * 0.16, width: S * 0.16, height: S * 0.16,
        transformOrigin: side === 1 ? '0% 50%' : '100% 50%', transform: `rotate(${side === 1 ? angle : -angle}deg)` }}>
        <div style={{ position: 'absolute', left: side === 1 ? S * 0.04 : -S * 0.06, top: 0, width: S * 0.18, height: S * 0.16, borderRadius: '50%', background: p.color,
          boxShadow: `inset ${-S * 0.03}px ${-S * 0.03}px 0 ${shade(p.color, -0.18)}` }} />
      </div>
    );
  };

  const sweat = mood === 'scared' && !reduce ? [0, 1].map(i => {
    const k = ((frame + i * 33) % 66) / 66;
    return <div key={i} style={{ position: 'absolute', left: i ? S * 0.86 : S * 0.02, top: h * 0.05 + k * h * 0.5, width: S * 0.09, height: S * 0.12,
      borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: '#8FD8FF', border: `${S * 0.015}px solid ${INK}`, opacity: k < 0.85 ? 1 : (1 - k) * 6 }} />;
  }) : null;

  const zzz = mood === 'sleep' ? [0, 1, 2].map(i => {
    const k = reduce ? 0.4 : ((frame + i * 40) % 120) / 120;
    return <span key={i} style={{ position: 'absolute', left: S * (0.8 + k * 0.3), top: -h * (0.1 + k * 0.6), font: `400 ${S * (0.18 + i * 0.04)}px ${FUN}`, color: INK, opacity: 1 - k }}>z</span>;
  }) : null;

  const bubbleSize = S * 0.3;
  const bump = p.bump;
  const pop = bump ? 1 + 0.5 * (1 - sp(bump.local, reduce, JELLY)) * (bump.local >= 0 ? 1 : 0) : 1;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: cx - S * 0.45, top: p.floor - S * 0.06, width: S * 0.9, height: S * 0.12, borderRadius: '50%',
        background: 'rgba(43,33,80,.16)', transform: `scale(${1 - Math.min(0.5, lift / (S * 2))})` }} />
      <div style={body}>
        {arm(-1)}{arm(1)}
        <div style={eye(-1)}>{eyeContent(-1)}</div>
        <div style={eye(1)}>{eyeContent(1)}</div>
        <div style={{ position: 'absolute', top: h * 0.56, left: S * 0.13, width: S * 0.12, height: S * 0.07, borderRadius: '50%', background: 'rgba(255,120,160,.55)' }} />
        <div style={{ position: 'absolute', top: h * 0.56, right: S * 0.13, width: S * 0.12, height: S * 0.07, borderRadius: '50%', background: 'rgba(255,120,160,.55)' }} />
        <div style={{ position: 'absolute', top: h * 0.6, left: '50%', transform: 'translateX(-50%)', boxSizing: 'border-box', ...mouth }} />
        {sweat}{zzz}
      </div>
      {p.crown && (
        <div style={{ position: 'absolute', left: cx - S * 0.2, top: p.floor - h - lift - S * 0.42, fontSize: S * 0.4, lineHeight: 1,
          transform: `rotate(${reduce ? 0 : Math.sin(t * 3) * 8}deg)` }}>👑</div>
      )}
      <div style={{ position: 'absolute', left: cx, top: p.floor - h - lift - bubbleSize * (p.crown ? 2.3 : 1.25), transform: `translateX(-50%) scale(${pop})`,
        minWidth: bubbleSize * 1.4, height: bubbleSize, padding: `0 ${bubbleSize * 0.3}px`, boxSizing: 'border-box', borderRadius: 999, background: '#fff',
        border: `${S * 0.025}px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        font: `400 ${bubbleSize * 0.72}px/1 ${FUN}`, color: INK }}>
        {bump ? <Digits value={p.score} from={bump.from} local={bump.local} reduce={reduce} size={bubbleSize * 0.8} /> : p.score}
      </div>
      {p.showName !== false && (
        // A name that won't fit at a readable size wraps onto two lines rather than shrinking to nothing.
        <div style={{ position: 'absolute', left: cx, top: p.floor + S * 0.1, transform: 'translateX(-50%)', textAlign: 'center',
          width: 'max-content', maxWidth: (p.labelMax ?? 600) - (p.active ? 36 : 0) + (p.active ? 32 : 0),
          font: `800 ${Math.max(24, fitSize(p.name, 800, WORD, (p.labelMax ?? 600) - (p.active ? 36 : 0), Math.max(24, S * 0.17)))}px/1.05 ${WORD}`, color: INK, background: p.active ? p.color : 'transparent', padding: p.active ? '6px 16px 2px' : 0,
          borderRadius: 20, ...(p.active && !light(p.color) ? { color: '#fff' } : {}) }}>{p.name}</div>
      )}
    </div>
  );

  function eyeContent(side: -1 | 1) {
    if (closed) return <div style={{ position: 'absolute', left: '15%', right: '15%', top: '45%', height: S * 0.03, background: INK, borderRadius: 9 }} />;
    if (happyEyes) return <div style={{ position: 'absolute', left: '18%', right: '18%', top: '38%', height: eyeSize * 0.35, borderTop: `${S * 0.035}px solid ${INK}`, borderRadius: '50% 50% 0 0' }} />;
    const wob = reduce ? 0 : Math.sin(t * 7 + side) * S * 0.004;
    return (
      <>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: pupil, height: pupil, borderRadius: '50%', background: INK,
          transform: `translate(calc(-50% + ${px + wob}px), calc(-50% + ${py}px))` }}>
          <div style={{ position: 'absolute', left: '22%', top: '18%', width: '30%', height: '30%', borderRadius: '50%', background: '#fff' }} />
        </div>
        {lid > 0 && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: `${lid * 100}%`, background: p.color, borderBottom: `${S * 0.02}px solid ${INK}` }} />}
      </>
    );
  }
}

/** True for a bright team colour (amber, cyan...) that needs dark text on it rather than white. */
function light(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3;
}

/** Where each pal stands: evenly along the floor, smaller when there are many teams. */
export function layoutPals(n: number, width: number, floor: number) {
  const size = Math.max(92, Math.min(205, (width - 200) / Math.max(1, n) - 50));
  const gap = Math.min(size * 1.9, (width - 160) / Math.max(1, n));
  const x0 = width / 2 - (gap * (n - 1)) / 2;
  return Array.from({ length: n }, (_, i) => ({ x: x0 + gap * i, floor, size, labelMax: gap - 18 }));
}

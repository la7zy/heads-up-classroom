// The jelly card: it plops onto the table, flips for a new card, gets a stamp, and leaves.
import type { CSSProperties } from 'react';
import type { Card, Category } from '../hu';
import { Picture } from './Picture';
import { FUN, INK, LEMON, WORD, BOUNCY, JELLY, ramp, sec, shade, sp, textWidth, wobble } from './util';

export const CARD_BOX = { x: 960, top: 92, w: 900, h: 566 };

/** Picks one or two lines and the biggest size that fits the card's width (with a little room to spare). */
export function fitWord(word: string, maxW: number, maxSize: number) {
  const width = (s: string) => (textWidth(s, 800, WORD) / 100) * 1.04;
  const parts = word.split(' ');
  let best = { lines: [word], size: Math.min(maxSize, maxW / width(word)) };
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i++) {
      const lines = [parts.slice(0, i).join(' '), parts.slice(i).join(' ')];
      const size = Math.min(maxSize * 0.86, maxW / Math.max(...lines.map(width)));
      if (size > best.size * 1.12) best = { lines, size };
    }
  }
  return { lines: best.lines, size: Math.max(44, Math.floor(best.size)) };
}

export type CardMode = 'deal' | 'steady' | 'flip' | 'point' | 'miss' | 'timeup' | 'paused';

export interface CardProps {
  card: Card;
  cat: Category;
  from?: { card: Card; cat: Category };   // the card being flipped away
  mode: CardMode;
  local: number;                          // frames since the mode started
  frame: number;
  reduce: boolean;
  code: string | null;
  move: string;
  points?: number;
  target?: { x: number; y: number };      // where the card flies after a point
}

function Face({ card, cat, frame, reduce, code, move, covered }: { card: Card; cat: Category; frame: number; reduce: boolean; code: string | null; move: string; covered: boolean }) {
  const wordOnly = !card.pic;
  const fit = fitWord(card.word, CARD_BOX.w - 110, wordOnly ? 190 : 150);
  const picSize = fit.lines.length > 1 ? 230 : 290;
  return (
    <>
      <div style={{ position: 'absolute', top: -34, visibility: covered ? 'hidden' : 'visible', left: '50%', transform: 'translateX(-50%) rotate(-3deg)', background: cat.field, color: '#fff',
        font: `400 38px/1 ${FUN}`, padding: '14px 32px 10px', borderRadius: 999, whiteSpace: 'nowrap', border: `5px solid ${INK}`, letterSpacing: '0.02em' }}>{cat.name}</div>
      <div style={{ position: 'absolute', inset: '44px 40px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {!wordOnly && <Picture pic={card.pic} code={code} move={move} size={picSize} frame={frame} reduce={reduce} />}
        <div style={{ font: `800 ${fit.size}px/0.98 ${WORD}`, color: INK, textAlign: 'center', whiteSpace: 'nowrap' }}>
          {fit.lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        {wordOnly && <div style={{ marginTop: 24, font: `700 40px/1.1 ${WORD}`, color: shade(cat.field, -0.35), background: shade(cat.field, 0.85), padding: '12px 30px', borderRadius: 999 }}>Describe it. Don't say it!</div>}
      </div>
    </>
  );
}

export function JellyCard(p: CardProps) {
  const { mode, local, reduce } = p;
  let tx = 0, ty = 0, rot = -1.5, sx = 1, sy = 1, rotY = 0, opacity = 1;
  let face = { card: p.card, cat: p.cat };

  if (mode === 'deal') {
    const fall = sec(0.36);
    if (local < fall && !reduce) {
      const k = local / fall;
      ty = -900 * (1 - k * k); rot = -14 + 12 * k; sx = 0.92; sy = 1.1;
    } else {
      const w = wobble(local - fall, reduce, 0.16, 8, 3.4);
      sx = 1 + w; sy = 1 - w;
    }
  }
  if (mode === 'flip' && !reduce) {
    const half = sec(0.2);
    if (local < half) { rotY = ramp(local, 0, half, 0, 90); if (p.from) face = p.from; }
    else rotY = -90 + 90 * sp(local - half, reduce, BOUNCY);
  }
  if (mode === 'timeup' && !reduce && local < sec(0.6)) tx = Math.sin(local * 1.3) * 26 * (1 - local / sec(0.6));
  const leaveAt = sec(1.35);
  if ((mode === 'point' || mode === 'miss') && local > leaveAt && !reduce) {
    const k = ramp(local, leaveAt, leaveAt + sec(0.55));
    const e = k * k;
    if (mode === 'point' && p.target) {
      tx = (p.target.x - CARD_BOX.x) * e; ty = (p.target.y - (CARD_BOX.top + CARD_BOX.h / 2)) * e;
      sx = sy = 1 - 0.85 * e; rot = -1.5 + 30 * e; opacity = 1 - ramp(k, 0.8, 1);
    } else { ty = 900 * e; rot = -1.5 - 18 * e; }
  }

  const box: CSSProperties = {
    position: 'absolute', left: CARD_BOX.x - CARD_BOX.w / 2, top: CARD_BOX.top, width: CARD_BOX.w, height: CARD_BOX.h, boxSizing: 'border-box',
    borderRadius: 64, background: '#fff', border: `16px solid ${face.cat.field}`,
    boxShadow: `0 22px 0 ${shade(face.cat.field, -0.3)}, 0 40px 60px -20px rgba(43,33,80,.4)`,
    transform: `translate(${tx}px, ${ty}px) perspective(2000px) rotateY(${rotY}deg) rotate(${rot}deg) scale(${sx}, ${sy})`,
    transformOrigin: '50% 100%', opacity
  };

  let stamp = null;
  if (mode === 'point' || mode === 'miss' || mode === 'timeup') {
    const s = mode === 'timeup' ? 1 : sp(local, reduce, JELLY);
    const label = mode === 'point' ? `+${p.points ?? 1}` : mode === 'miss' ? 'So close!' : "Time's up";
    const bg = mode === 'point' ? LEMON : mode === 'miss' ? '#8FD8FF' : '#FF6F61';
    const round = mode === 'point';
    // "+1" sits on the top corner; the wider word stamps sit on the bottom corner, clear of the category label.
    const place = round ? { right: -70, top: -80 } : { right: -120, bottom: -70 };
    stamp = (
      <div style={{ position: 'absolute', ...place, transform: `rotate(${round ? 10 : -6}deg) scale(${s})`,
        background: bg, color: INK, border: `10px solid ${INK}`, borderRadius: round ? '50%' : 40,
        width: round ? 230 : 'auto', height: round ? 230 : 'auto', padding: round ? 0 : '22px 40px 16px', display: 'grid', placeItems: 'center',
        font: `400 ${round ? 120 : 76}px/1 ${FUN}`, whiteSpace: 'nowrap', boxShadow: `0 12px 0 ${INK}` }}>{label}</div>
    );
  }

  let blanket = null;
  if (mode === 'paused') {
    const k = sp(local, reduce, { damping: 16, stiffness: 140 });
    blanket = (
      <div style={{ position: 'absolute', inset: -16, borderRadius: 64, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - k) * -105}%)`, background: '#6C5BD4',
          backgroundImage: 'radial-gradient(#8B7DE8 18%, transparent 19%)', backgroundSize: '64px 64px', display: 'grid', placeItems: 'center' }}>
          <div style={{ font: `400 150px/1 ${FUN}`, color: '#fff', textShadow: `0 10px 0 ${INK}` }}>Paused</div>
        </div>
      </div>
    );
  }

  return (
    <div style={box}>
      <Face card={face.card} cat={face.cat} frame={p.frame} reduce={reduce} code={face === p.from ? null : p.code} move={p.move} covered={mode === 'paused'} />
      {stamp}
      {blanket}
    </div>
  );
}

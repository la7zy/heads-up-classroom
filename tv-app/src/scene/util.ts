import { interpolate, spring } from 'remotion';

export const FPS = 60;
export const W = 1920;
export const H = 1080;

export const INK = '#2B2150';
export const LILAC = '#EFE7FF';
export const LEMON = '#FFE45C';
export const FUN = "'Chewy', 'Baloo 2', system-ui, sans-serif";
export const WORD = "'Baloo 2', system-ui, sans-serif";

export const LEVEL_COLORS: Record<string, string> = { beginner: '#FF5A36', elementary: '#2F6BFF', advanced: '#12A877' };

export type SpringCfg = { damping?: number; stiffness?: number; mass?: number };
export const BOUNCY: SpringCfg = { damping: 8, stiffness: 140 };
export const SNAPPY: SpringCfg = { damping: 14, stiffness: 180 };
export const SMOOTH: SpringCfg = { damping: 200 };
export const JELLY: SpringCfg = { damping: 5, stiffness: 120 };

/** Every spring here has settled long before this many frames (5 s); past it the answer is simply 1. */
const SETTLED = FPS * 5;

/**
 * A Remotion spring that starts at `local` frame 0. With reduced motion, or once it has settled, it is 1.
 * Remotion's spring() steps through every frame up to the one asked for, so asking for a frame far in the
 * future (a moment that ended minutes ago) would freeze the TV; capping the frame keeps each call tiny.
 */
export const sp = (local: number, reduce: boolean, config: SpringCfg = SNAPPY) =>
  (reduce || local >= SETTLED ? 1 : spring({ frame: Math.max(0, local), fps: FPS, config }));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Clamped interpolate over frames. */
export const ramp = (local: number, from: number, to: number, a = 0, b = 1) =>
  interpolate(local, [from, to], [a, b], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** Seconds to frames. */
export const sec = (s: number) => Math.round(s * FPS);

/** A soft jelly wobble that dies out: returns a signed amount, 0 at rest. */
export const wobble = (local: number, reduce: boolean, amount = 0.14, speed = 9, decay = 3.2) => {
  if (reduce || local < 0) return 0;
  const t = local / FPS;
  return amount * Math.exp(-decay * t) * Math.sin(t * speed * Math.PI);
};

/** Deterministic pseudo-random number in [0, 1) for a seed. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

let measurer: CanvasRenderingContext2D | null = null;
/**
 * Width in px of `text` at 100px in a weight and font stack. The canvas picks the first font in the stack
 * that is available, just as the page does, so the answer is right online (Chewy, Baloo 2) and offline (system font).
 */
export function textWidth(text: string, weight: number, family: string) {
  measurer ??= document.createElement('canvas').getContext('2d');
  if (!measurer) return text.length * 55;
  measurer.font = `${weight} 100px ${family}`;
  return measurer.measureText(text).width;
}

/** The largest font size (up to `max`) at which `text` fits in `width` px. */
export const fitSize = (text: string, weight: number, family: string, width: number, max: number) =>
  Math.min(max, Math.floor((width / Math.max(1, textWidth(text, weight, family))) * 100));

/** Mixes a hex colour toward white (t > 0) or black (t < 0). */
export function shade(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => Math.round(t > 0 ? c + (255 - c) * t : c * (1 + t)));
  return `#${ch.map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

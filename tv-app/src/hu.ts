// Types for the game data and helpers that core.js puts on window.HU.
// The teacher screen owns the game state; the TV only reads it and sends three notes back.

export type Phase = 'setup' | 'ready' | 'playing' | 'paused' | 'timeup' | 'over';

export interface Team { id: string; name: string; color: string; score: number }

export interface GameEvent {
  type: string;
  seq: number;
  cardId?: string;
  from?: string;
  team?: string;
  n?: number;
}

export interface GameState {
  v: number;
  sid: string;
  seq: number;
  phase: Phase;
  teams: Team[];
  current: number;
  cardId: string | null;
  deck: string[];
  settings: { level: string; seconds: number; points: number; cats: string[]; sound: boolean; classOnly: boolean };
  timer: { total: number; endsAt: number; left: number; preGo?: boolean };
  turns: number;
  event: GameEvent | null;
}

export interface Card { id: string; level: string; cat: string; catKey: string; word: string; pic: string; lesson: boolean; meaning: string }
export interface Category { id: string; key: string; name: string; field: string; level: string }
export interface Level { key: string; name: string; note: string }

export type TvNote = { t: 'hello' } | { t: 'tv' } | { t: 'timeup' };

interface HUGlobal {
  KEY: string;
  TV_KEY: string;
  LEAD: number;
  CARD: Record<string, Card>;
  CAT: Record<string, Category>;
  LEVELS: Level[];
  isTV: boolean;
  chan: BroadcastChannel | null;
  levelOf: (key: string) => Level;
  lottieCode: (pic: string) => string | null;
  motionFor: (card: Card) => string;
  store: { read: (k: string) => unknown; write: (k: string, v: unknown) => boolean };
  send: (msg: unknown) => void;
  timeLeft: (s: GameState) => number;
}

declare global {
  interface Window { HU?: HUGlobal }
}

export const HU = (): HUGlobal => {
  if (!window.HU) throw new Error('core.js must load before the TV screen');
  return window.HU;
};

/** A state from the teacher screen is used only if it has the fields the TV draws from. */
export function isState(s: unknown): s is GameState {
  const g = s as GameState | null;
  return !!g && (g.v === 1 || g.v === 2) && Array.isArray(g.teams) && g.teams.length > 0 && !!g.settings && !!g.timer;
}

/** True during the 3-2-1-GO, before the class has seen the card. */
export const countingDown = (s: GameState, now: number) => s.phase === 'playing' && s.timer.endsAt - s.timer.total > now;

export const fmt = (ms: number) => {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

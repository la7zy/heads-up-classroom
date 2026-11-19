// Keeps the TV in step with the teacher screen: takes each new state, stamps every event with the
// Remotion frame it arrived on (so the scene can play it from there), and sends the TV's notes back.
import { useCallback, useEffect, useRef, useState } from 'react';
import { HU, isState, countingDown, type GameEvent, type GameState, type TvNote } from './hu';
import { cue } from './sound';

export interface StampedEvent { ev: GameEvent; frame: number; prev: GameState | null }
export interface ScoreBump { from: number; to: number; frame: number }

export interface Game {
  state: GameState | null;
  event: StampedEvent | null;
  bumps: Record<string, ScoreBump>;
}

function tvSend(msg: TvNote) {
  const hu = HU();
  hu.send(msg);
  hu.store.write(hu.TV_KEY, { ...msg, at: Date.now() });
}

export function useGame(getFrame: () => number, armed: boolean): Game {
  const [game, setGame] = useState<Game>({ state: null, event: null, bumps: {} });
  const ref = useRef(game);
  ref.current = game;
  const timers = useRef<number[]>([]);
  const soundOn = () => !!ref.current.state?.settings.sound;

  const clearTimers = () => { timers.current.forEach(t => window.clearTimeout(t)); timers.current = []; };
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, Math.max(0, ms))); };

  /** The 3-2-1-GO plays on the teacher's clock, so both screens and the sound agree. */
  const scheduleCountdown = useCallback((s: GameState) => {
    const startAt = s.timer.endsAt - s.timer.total;
    const beat = HU().LEAD / 4;
    [3, 2, 1].forEach((n, i) => later(startAt - n * beat - Date.now(), () => cue(soundOn(), 'beat', i)));
    later(startAt - Date.now(), () => { cue(soundOn(), 'go'); cue(soundOn(), 'deal'); });
  }, []);

  const accept = useCallback((s: unknown) => {
    if (!isState(s)) return;
    const cur = ref.current;
    const T = cur.state;
    if (T && s.sid === T.sid && s.seq <= T.seq) return;
    const frame = getFrame();
    const bumps = { ...cur.bumps };
    if (T) {
      s.teams.forEach(t => {
        const before = T.teams.find(o => o.id === t.id);
        if (before && before.score !== t.score) bumps[t.id] = { from: before.score, to: t.score, frame };
      });
    }
    let event = cur.event;
    const fresh = s.event && (!T || T.sid !== s.sid || !T.event || T.event.seq !== s.event.seq);
    if (T && fresh && s.event) {
      event = { ev: s.event, frame, prev: T };
      const on = !!s.settings.sound;
      switch (s.event.type) {
        case 'card': clearTimers(); scheduleCountdown(s); break;
        case 'change': cue(on, 'flip'); break;
        case 'timeup': cue(on, 'timeUp'); break;
        case 'point': clearTimers(); cue(on, 'point'); break;
        case 'nopoint': clearTimers(); cue(on, 'miss'); break;
        case 'ready': cue(on, 'ready'); break;
        case 'pause': cue(on, 'pause'); break;
        case 'over': clearTimers(); cue(on, 'fanfare'); break;
        default: break;
      }
    } else if (!T) {
      event = null;
      if (s.phase === 'playing' && countingDown(s, Date.now())) scheduleCountdown(s);
    }
    setGame({ state: s, event, bumps });
  }, [getFrame, scheduleCountdown]);

  useEffect(() => {
    const hu = HU();
    const onMsg = (e: MessageEvent) => { if (e.data && e.data.t === 'state') accept(e.data.s); };
    const onStore = (e: StorageEvent) => {
      if (e.key !== hu.KEY || !e.newValue) return;
      try { accept(JSON.parse(e.newValue)); } catch (err) { /* a half-written value is replaced by the next update */ }
    };
    hu.chan?.addEventListener('message', onMsg);
    window.addEventListener('storage', onStore);
    accept(hu.store.read(hu.KEY));
    tvSend({ t: 'hello' });
    const beat = window.setInterval(() => tvSend({ t: 'tv' }), 2000);
    return () => {
      hu.chan?.removeEventListener('message', onMsg);
      window.removeEventListener('storage', onStore);
      window.clearInterval(beat);
      clearTimers();
    };
  }, [accept]);

  useEffect(() => { if (armed) tvSend({ t: 'hello' }); }, [armed]);

  // The last five seconds tick, and the TV tells the teacher screen when time runs out.
  useEffect(() => {
    let lastWhole = -1;
    let sent = '';
    const id = window.setInterval(() => {
      const s = ref.current.state;
      if (!s || s.phase !== 'playing') { lastWhole = -1; return; }
      const left = HU().timeLeft(s);
      const whole = Math.ceil(left / 1000);
      if (!countingDown(s, Date.now()) && whole !== lastWhole && whole <= 5 && whole > 0 && lastWhole !== -1) cue(soundOn(), 'tick');
      lastWhole = whole;
      const turn = `${s.sid}:${s.timer.endsAt}`;
      if (left <= 0 && sent !== turn) { sent = turn; tvSend({ t: 'timeup' }); }
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  return game;
}

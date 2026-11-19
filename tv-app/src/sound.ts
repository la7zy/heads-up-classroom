// Game sounds, built from Bencho's synthesised interface sounds (MIT, see vendor/BENCHO-LICENSE.txt).
// Bencho tunes them for a laptop speaker in a quiet room; a classroom TV needs them several times louder.
import { play } from './vendor/bencho-sounds';

const LOUD = 5;
let armed = false;

/** Browsers allow audio only after a click, so the TV's start button arms it. */
export const armSound = () => { armed = true; play('tick', { volume: 0.01 }); };

const at = (ms: number, fn: () => void) => { window.setTimeout(fn, ms); };

export const sounds = {
  beat: (i: number) => play('latch', { volume: LOUD, pitch: [1, 1.26, 1.5][i] ?? 1 }),
  go: () => play('landed', { volume: LOUD * 1.4 }),
  deal: () => play('plop', { volume: LOUD }),
  flip: () => play('glide', { volume: LOUD, pitch: 1.4 }),
  tick: () => play('tick', { volume: LOUD * 1.2, pitch: 2.2 }),
  timeUp: () => { play('bump', { volume: LOUD * 1.6, pitch: 0.7 }); at(120, () => play('buzz', { volume: LOUD * 1.6, pitch: 0.55 })); },
  point: () => { play('paid', { volume: LOUD * 1.3 }); at(260, () => play('landed', { volume: LOUD })); },
  miss: () => play('sigh', { volume: LOUD * 1.2 }),
  ready: () => play('perk', { volume: LOUD }),
  pause: () => play('hush', { volume: LOUD }),
  fanfare: () => [0, 180, 360].forEach((ms, i) => at(ms, () => play('landed', { volume: LOUD, pitch: 1 + i * 0.12 })))
};

export type SoundKey = keyof typeof sounds;

/** Plays a game sound if the TV has been started and the teacher left sound on. */
export function cue(on: boolean, key: SoundKey, ...args: [number?]) {
  if (!armed || !on) return;
  try { (sounds[key] as (i?: number) => void)(...args); } catch (e) { /* audio can fail on some TVs; the game goes on silently */ }
}

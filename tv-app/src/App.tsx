import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { useGame } from './game';
import { armSound } from './sound';
import { TvScene } from './scene/TvScene';
import { FLOOR_TOP, floorColor } from './scene/Bits';
import { FPS, H, LEVEL_COLORS, LILAC, W } from './scene/util';

/** A screen that is not 16:9 shows bands around the game; paint them so the sky and the floor carry on. */
function useBands(level: string | undefined) {
  useEffect(() => {
    const root = document.getElementById('tvRoot');
    if (!root) return;
    const paint = () => {
      // Measure where the game really is on the page; the Player centres and scales it to fit.
      const scene = document.querySelector('[data-tv-scene]');
      const r = scene?.getBoundingClientRect();
      const scale = r && r.height ? r.height / H : Math.min(innerWidth / W, innerHeight / H);
      const top = (r ? r.top : (innerHeight - H * scale) / 2) + FLOOR_TOP * scale;
      const floor = floorColor(level ? LEVEL_COLORS[level] ?? '#8B5CF6' : '#8B5CF6');
      root.style.background = `linear-gradient(to bottom, ${LILAC} 0, ${LILAC} ${top}px, ${floor} ${top}px)`;
    };
    // The Player rescales a moment after the window changes, so paint again once it has.
    let timers: number[] = [];
    const later = () => { timers.forEach(t => window.clearTimeout(t)); timers = [60, 250, 700].map(ms => window.setTimeout(paint, ms)); };
    const first = requestAnimationFrame(paint);
    later();
    addEventListener('resize', later);
    document.addEventListener('fullscreenchange', later);
    return () => {
      cancelAnimationFrame(first);
      timers.forEach(t => window.clearTimeout(t));
      removeEventListener('resize', later);
      document.removeEventListener('fullscreenchange', later);
    };
  }, [level]);
}

// One endless timeline: six hours at 60 frames a second, looping. Events carry the frame they started on.
const DURATION = FPS * 60 * 60 * 6;

export function App() {
  const reduce = useMemo(() => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const player = useRef<PlayerRef>(null);
  // ?nogate skips the start button, for screenshot runs only; in class the button turns the sound on.
  const [armed, setArmed] = useState(() => new URLSearchParams(location.search).has('nogate'));
  const getFrame = useCallback(() => player.current?.getCurrentFrame() ?? 0, []);
  const game = useGame(getFrame, armed);
  // Test runs only (?debug in the address): lets a checker pause the TV on an exact frame for screenshots.
  if (new URLSearchParams(location.search).has('debug')) (window as unknown as { __tvPlayer: typeof player }).__tvPlayer = player;
  useBands(game.state?.settings.level);

  const start = useCallback(() => {
    armSound();
    const root = document.documentElement;
    if (root.requestFullscreen && !document.fullscreenElement) root.requestFullscreen().catch(() => { /* fullscreen is optional; the TV works in a window too */ });
    player.current?.play();
    setArmed(true);
  }, []);

  // Before a game starts, a big start button. If the TV is reopened mid-game, the game shows straight away
  // and a small note asks for one click anywhere to bring the sound back (browsers need a click for sound).
  const midGame = !!game.state && game.state.phase !== 'setup';
  useEffect(() => {
    if (armed) return;
    const any = () => start();
    window.addEventListener('pointerdown', any);
    window.addEventListener('keydown', any);
    return () => { window.removeEventListener('pointerdown', any); window.removeEventListener('keydown', any); };
  }, [armed, start]);

  return (
    <>
      <Player
        ref={player}
        component={TvScene}
        inputProps={{ game, reduce }}
        durationInFrames={DURATION}
        fps={FPS}
        compositionWidth={W}
        compositionHeight={H}
        autoPlay
        loop
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        spaceKeyToPlayOrPause={false}
        acknowledgeRemotionLicense
        style={{ width: '100vw', height: '100vh', background: 'transparent' }}
      />
      {!armed && !midGame && (
        <div className="tvx-gate">
          <h1>Heads Up!</h1>
          <button type="button" onClick={start}>Start the TV screen</button>
          <p>Put this window on the TV, then press the button. It turns on the sound and fills the screen.</p>
        </div>
      )}
      {!armed && midGame && <button type="button" className="tvx-note" onClick={start}>Click anywhere on the TV to turn the sound back on</button>}
    </>
  );
}

// The card's picture. An official Noto animation plays frame by frame through @remotion/lottie;
// a picture without one moves on its own (hop, sway, float...), and so does every picture while its animation loads.
import { useEffect, useState } from 'react';
import { Lottie, type LottieAnimationData } from '@remotion/lottie';
import { FPS } from './util';

const cache = new Map<string, Promise<LottieAnimationData>>();
export function loadLottie(code: string) {
  if (!cache.has(code)) {
    cache.set(code, fetch(`emoji/${code}.json`).then(r => {
      if (!r.ok) throw new Error(`emoji/${code}.json: HTTP ${r.status}`);
      return r.json() as Promise<LottieAnimationData>;
    }));
  }
  return cache.get(code)!;
}

// Still pictures come from stills.json (Google's Noto pictures, packed next to the game), so they look the same
// with or without internet. The emoji font is only the fallback while that file loads.
let stills: Promise<Record<string, string>> | null = null;
const urls = new Map<string, string>();
export function loadStills() {
  stills ??= fetch('stills.json').then(r => (r.ok ? r.json() : {})).catch(() => ({}));
  return stills;
}
const bareCode = (pic: string) => [...pic].map(ch => ch.codePointAt(0)!.toString(16)).filter(c => c !== 'fe0f').join('_');
function stillUrl(map: Record<string, string>, pic: string) {
  const key = bareCode(pic);
  if (!map[key]) return null;
  if (!urls.has(key)) urls.set(key, URL.createObjectURL(new Blob([map[key]], { type: 'image/svg+xml' })));
  return urls.get(key)!;
}

/** The made movement for a still picture, as a transform for this frame. Big enough to read as alive from the back row. */
export function madeMove(kind: string, frame: number, reduce: boolean) {
  if (reduce) return 'none';
  const t = frame / FPS;
  switch (kind) {
    case 'hop': {
      const k = (t * 1.5) % 1;
      const up = Math.sin(Math.min(1, k / 0.7) * Math.PI);
      const land = k > 0.7 ? Math.sin(((k - 0.7) / 0.3) * Math.PI) : 0;
      return `translateY(${-up * 34}px) scale(${1 + land * 0.1}, ${1 - land * 0.12})`;
    }
    case 'sway': return `rotate(${Math.sin(t * 2.4) * 12}deg)`;
    case 'drive': return `translateX(${Math.sin(t * 1.8) * 36}px) rotate(${Math.sin(t * 9) * 2}deg)`;
    case 'breathe': return `scale(${1 + Math.sin(t * 2.6) * 0.07})`;
    case 'drift': return `translate(${Math.sin(t * 1.1) * 30}px, ${Math.sin(t * 2.2) * 10}px) rotate(${Math.sin(t * 1.1) * 6}deg)`;
    default: return `translateY(${Math.sin(t * 2.2) * 16}px) rotate(${Math.sin(t * 1.1) * 5}deg)`;
  }
}

export function Picture({ pic, code, move, size, frame, reduce }: { pic: string; code: string | null; move: string; size: number; frame: number; reduce: boolean }) {
  const [data, setData] = useState<{ code: string; json: LottieAnimationData } | null>(null);
  const [map, setMap] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    let live = true;
    if (!code) return;
    loadLottie(code).then(json => { if (live) setData({ code, json }); }).catch(() => { /* the made movement stays */ });
    return () => { live = false; };
  }, [code]);
  useEffect(() => {
    let live = true;
    loadStills().then(m => { if (live) setMap(m); });
    return () => { live = false; };
  }, []);

  if (code && data && data.code === code) {
    return (
      <div style={{ width: size, height: size }}>
        <Lottie animationData={data.json} loop playbackRate={reduce ? 0 : 1} style={{ width: size, height: size }} />
      </div>
    );
  }
  const url = map ? stillUrl(map, pic) : null;
  const moveNow = madeMove(move, frame, reduce);
  return (
    <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>
      {url
        ? <img src={url} alt="" style={{ width: size * 0.86, height: size * 0.86, transform: moveNow }} />
        : <span style={{ fontSize: size * 0.8, lineHeight: 1, fontFamily: "'Noto Color Emoji', 'Segoe UI Emoji', sans-serif", transform: moveNow, display: 'inline-block' }}>{pic}</span>}
    </div>
  );
}

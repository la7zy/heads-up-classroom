// Heads Up: shared pieces for the teacher screen and the TV screen.
// Builds one card index across the three class decks and holds the small helpers both screens use.
window.HU = (() => {
  'use strict';

  const KEY = 'heads-up-elementary-v1';
  const TV_KEY = KEY + '-tv';
  const TV_LINK = 'https://claude.ai/artifact/Der5QeWSmUNY7RGxsqafXH#tv';

  const LEVELS = [
    { key: 'beginner', name: 'Beginners101', note: 'A2 to B1 · ages 14 to 33' },
    { key: 'elementary', name: 'Elementary', note: 'A1 to A2 · ages 10 to 13' },
    { key: 'advanced', name: 'Advanced', note: 'B1 to B2 · adults' }
  ];
  const decks = window.HU_DECKS || {};
  const DECKS = {
    beginner: decks.beginner || [],
    elementary: window.HU_CARDS || decks.elementary || [],
    advanced: decks.advanced || []
  };

  // Card ids look like "advanced/crown/3"; category ids like "advanced/crown".
  const CAT = {};
  const CARD = {};
  LEVELS.forEach(({ key: level }) => DECKS[level].forEach(cat => {
    const catId = `${level}/${cat.key}`;
    CAT[catId] = { ...cat, id: catId, level };
    cat.cards.forEach(([word, pic, extra, meaning], i) => {
      const id = `${catId}/${i}`;
      CARD[id] = { id, level, cat: catId, catKey: cat.key, word, pic: pic || '', lesson: !extra, meaning: meaning || '' };
    });
  }));
  const catsOf = level => Object.values(CAT).filter(c => c.level === level);
  const levelOf = key => LEVELS.find(l => l.key === key) || LEVELS[1];
  /** A card is in play when it belongs to the chosen class, its category is on, and (with "lessons only") it comes from the class material. */
  const inPlay = (id, settings) => {
    const c = CARD[id];
    return !!c && c.level === settings.level && settings.cats.includes(c.cat) && (!settings.classOnly || c.lesson);
  };

  // ---------- animated pictures ----------
  const ANIMATED = new Set(window.HU_ANIMATED || []);
  const codeOf = pic => [...pic].map(ch => ch.codePointAt(0).toString(16)).join('_');
  /** The Lottie file code for a picture, or null when it has no official animation. */
  function lottieCode(pic) {
    if (!pic) return null;
    const full = codeOf(pic);
    if (ANIMATED.has(full)) return full;
    const bare = full.split('_').filter(c => c !== 'fe0f').join('_');
    return ANIMATED.has(bare) ? bare : null;
  }
  const MOTION_BY_CAT = {
    animals: 'hop', jobs: 'hop', people: 'hop', actions: 'hop', food: 'sway', nature: 'sway', weather: 'drift', places: 'breathe',
    transport: 'drive', travel: 'drive', home: 'float', things: 'float', school: 'float', clothes: 'float', sports: 'float', stories: 'float', funny: 'hop'
  };
  const MOTION_BY_WORD = {
    rain: 'drift', snow: 'drift', cloud: 'drift', wind: 'drift', storm: 'drift', satellite: 'drift',
    superhero: 'hop', secretary: 'hop', astronaut: 'float', ice: 'float', shell: 'float', nest: 'sway'
  };
  const motionFor = card => MOTION_BY_WORD[card.word] || MOTION_BY_CAT[card.catKey] || 'float';

  // ---------- small helpers ----------
  const $ = id => document.getElementById(id);
  function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'style') Object.entries(v).forEach(([sk, sv]) => (sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv)));
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    kids.flat().forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : String(c)); });
    return el;
  }
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const int = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);
  const fmt = ms => { const s = Math.ceil(Math.max(0, ms) / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const store = {
    read(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    // A blocked store only costs reload-survival and the backup sync path; the game itself keeps running.
    write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  const chan = (() => { try { return new BroadcastChannel('heads-up-elementary'); } catch (e) { return null; } })();
  const send = msg => { if (chan) chan.postMessage(msg); };
  const LEAD = 3400; // the 3-2-1-GO countdown before each card; the turn's own time starts after it
  function timeLeft(s) {
    if (s.phase === 'playing') return Math.max(0, Math.min(s.timer.total, s.timer.endsAt - Date.now()));
    if (s.phase === 'paused') return s.timer.left;
    if (s.phase === 'timeup') return 0;
    return s.settings.seconds * 1000;
  }

  return {
    KEY, TV_KEY, TV_LINK, LEVELS, DECKS, CAT, CARD, catsOf, levelOf, inPlay, lottieCode, motionFor,
    $, h, clamp, int, fmt, shuffle, store, chan, send, timeLeft, LEAD,
    SID: Math.random().toString(36).slice(2, 10),
    isTV: location.hash.replace('#', '') === 'tv'
  };
})();

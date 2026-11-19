// Heads Up teacher screen: owns the game state, saves it, and broadcasts it to the TV screen.
(() => {
  'use strict';
  const HU = window.HU;
  if (!HU || HU.isTV) return;
  const { KEY, TV_KEY, TV_LINK, LEVELS, CAT, CARD, catsOf, levelOf, inPlay, $, h, clamp, int, fmt, shuffle, store, chan, send, timeLeft, LEAD, SID } = HU;

  const TEAM_COLORS = ['#FF5A36', '#12B76A', '#2F6BFF', '#F23D8E', '#FFB020', '#11B5C9', '#8B5CF6', '#64748B'];
  const TEAM_NAMES = ['Lions', 'Eagles', 'Sharks', 'Pandas', 'Tigers', 'Owls', 'Wolves', 'Dolphins', 'Foxes', 'Bears', 'Koalas', 'Zebras'];
  const PRESETS = [[30, '30 s'], [45, '45 s'], [60, '1 min'], [90, '90 s'], [120, '2 min']];
  const MIN_SECS = 5;
  const MAX_SECS = 600;
  const MAX_POINTS = 5;
  const MAX_TEAMS = 12;
  const NAME_MAX = 20;

  let S = restore(store.read(KEY));
  let tvSeen = 0;
  let errors = {};

  function makeTeam(teams) {
    const names = new Set(teams.map(t => t.name));
    const colors = new Set(teams.map(t => t.color));
    return {
      id: 't' + Math.random().toString(36).slice(2, 8),
      name: TEAM_NAMES.find(n => !names.has(n)) || `Team ${teams.length + 1}`,
      color: TEAM_COLORS.find(c => !colors.has(c)) || TEAM_COLORS[teams.length % TEAM_COLORS.length],
      score: 0
    };
  }
  function allCats(level) { return catsOf(level).map(c => c.id); }
  function freshState() {
    const a = makeTeam([]);
    const b = makeTeam([a]);
    return {
      v: 2, sid: SID, seq: 0, phase: 'setup', teams: [a, b], current: 0, cardId: null, deck: [], deckCats: '',
      settings: { level: 'elementary', seconds: 60, points: 1, cats: allCats('elementary'), sound: true, classOnly: false },
      timer: { total: 60000, endsAt: 0, left: 60000 }, turns: 0, event: null
    };
  }
  function restore(s) {
    if (!s || (s.v !== 1 && s.v !== 2) || !Array.isArray(s.teams) || !s.teams.length || !s.settings) return freshState();
    const level = LEVELS.some(l => l.key === s.settings.level) ? s.settings.level : 'elementary';
    const cats = (Array.isArray(s.settings.cats) ? s.settings.cats : []).filter(k => CAT[k] && CAT[k].level === level);
    const settings = {
      level,
      seconds: clamp(int(s.settings.seconds, 60), MIN_SECS, MAX_SECS),
      points: clamp(int(s.settings.points, 1), 1, MAX_POINTS),
      cats: cats.length ? cats : allCats(level),
      sound: s.settings.sound !== false,
      classOnly: s.settings.classOnly === true
    };
    const teams = s.teams.slice(0, MAX_TEAMS).map((t, i) => ({
      id: String(t.id || `t${i}`), name: String(t.name || '').slice(0, NAME_MAX),
      color: TEAM_COLORS.includes(t.color) ? t.color : TEAM_COLORS[i % TEAM_COLORS.length],
      score: Math.max(0, int(t.score, 0))
    }));
    const cardId = CARD[s.cardId] ? s.cardId : null;
    const total = settings.seconds * 1000;
    let phase = ['setup', 'ready', 'playing', 'paused', 'timeup', 'over'].includes(s.phase) ? s.phase : 'setup';
    let timer = { total, endsAt: 0, left: clamp(int(s.timer && s.timer.left, total), 0, total), preGo: phase === 'paused' && !!(s.timer && s.timer.preGo) };
    if (['playing', 'paused', 'timeup'].includes(phase) && !cardId) phase = 'ready';
    if (phase === 'playing') {
      // A reload mid-turn comes back paused, so nobody loses time.
      const left = int(s.timer && s.timer.endsAt, 0) - Date.now();
      phase = left > 0 ? 'paused' : 'timeup';
      timer = { ...timer, left: clamp(left, 0, total), preGo: left > total }; // a reload during the 3-2-1 gives back the whole turn
    }
    return {
      v: 2, sid: SID, seq: Math.max(0, int(s.seq, 0)), phase, teams, current: clamp(int(s.current, 0), 0, teams.length - 1),
      cardId, deck: Array.isArray(s.deck) ? s.deck.filter(id => CARD[id]) : [], deckCats: String(s.deckCats || ''),
      settings, timer, turns: Math.max(0, int(s.turns, 0)), event: null
    };
  }

  function commit(patch, event, opts = {}) {
    const seq = S.seq + 1;
    S = { ...S, ...patch, sid: SID, seq, event: event ? { ...event, seq } : S.event };
    store.write(KEY, S);
    send({ t: 'state', s: S });
    if (event) announce(event);
    if (opts.render !== false) render();
  }
  function announce(ev) {
    const team = S.teams.find(t => t.id === ev.team);
    const say = {
      card: 'Turn started.', change: 'Card changed.', timeup: "Time's up.", pause: 'Paused.', resume: 'Timer running.',
      point: team ? `Point to ${team.name}.` : 'Point given.', nopoint: 'No point this time.', over: 'Game over.'
    }[ev.type];
    if (say) $('live').textContent = say;
  }

  // ---- deck ----
  const deckKey = settings => `v3:${settings.level}:` + [...settings.cats].sort().join(',') + (settings.classOnly ? '|lessons' : '');
  const buildDeck = (settings, avoid) => shuffle(Object.keys(CARD).filter(id => inPlay(id, settings) && id !== avoid));
  const countInPlay = settings => Object.keys(CARD).filter(id => inPlay(id, settings)).length;
  function drawFrom(deck, settings, avoid) {
    const usable = deck.filter(id => inPlay(id, settings) && id !== avoid);
    const pile = usable.length ? usable : buildDeck(settings, avoid);
    if (!pile.length) return { cardId: avoid, deck: [] }; // only one card in play: keep it
    return { cardId: pile[0], deck: pile.slice(1) };
  }

  // ---- actions ----
  const secs = () => S.settings.seconds * 1000;
  /** True before the class has seen the card: during the 3-2-1-GO, or paused before GO. */
  const countingDown = () => (S.phase === 'playing' && S.timer.endsAt - S.timer.total > Date.now()) || (S.phase === 'paused' && S.timer.preGo === true);
  function validate() {
    const e = {};
    const names = S.teams.map(t => t.name.trim().toLowerCase());
    if (!S.teams.length) e.team = 'Add at least one team.';
    else if (names.some(n => !n)) e.team = 'Every team needs a name.';
    else if (new Set(names).size !== names.length) e.team = 'Two teams have the same name. Change one of them.';
    if (!catsOf(S.settings.level).length) e.cat = `The ${levelOf(S.settings.level).name} cards are not loaded yet.`;
    else if (!S.settings.cats.length) e.cat = 'Pick at least one category.';
    else if (!countInPlay(S.settings)) e.cat = 'None of these categories has lesson words. Pick more categories or untick "Only words from their lessons".';
    return e;
  }
  function startGame() {
    errors = validate();
    if (Object.keys(errors).length) { render(); return; }
    const key = deckKey(S.settings);
    const deck = key === S.deckCats && S.deck.length ? S.deck : buildDeck(S.settings, null);
    commit({
      phase: 'ready', deck, deckCats: key, teams: S.teams.map(t => ({ ...t, name: t.name.trim() })),
      current: clamp(S.current, 0, S.teams.length - 1), timer: { total: secs(), endsAt: 0, left: secs() }
    }, { type: 'ready' });
  }
  function startTurn() {
    if (S.phase !== 'ready') return;
    const next = drawFrom(S.deck, S.settings, null);
    commit({ phase: 'playing', cardId: next.cardId, deck: next.deck, timer: { total: secs(), endsAt: Date.now() + secs() + LEAD, left: secs() } },
      { type: 'card', cardId: next.cardId, team: S.teams[S.current].id });
  }
  function changeCard() {
    if (!['playing', 'paused'].includes(S.phase) || countingDown()) return;
    const next = drawFrom(S.deck, S.settings, S.cardId);
    if (next.cardId === S.cardId) return;
    commit({ cardId: next.cardId, deck: [...next.deck, S.cardId] }, { type: 'change', cardId: next.cardId, from: S.cardId });
  }
  function pause() {
    if (S.phase !== 'playing') return;
    commit({ phase: 'paused', timer: { ...S.timer, left: timeLeft(S), preGo: countingDown() } }, { type: 'pause' });
  }
  function resume() {
    if (S.phase !== 'paused') return;
    commit({ phase: 'playing', timer: { ...S.timer, endsAt: Date.now() + S.timer.left, preGo: false } }, { type: 'resume' });
  }
  function timeUp() {
    if (S.phase !== 'playing') return;
    commit({ phase: 'timeup', timer: { ...S.timer, left: 0, endsAt: Date.now() } }, { type: 'timeup', cardId: S.cardId });
  }
  function award(point) {
    const team = S.teams[S.current];
    const n = point ? S.settings.points : 0;
    const teams = S.teams.map((t, i) => (i === S.current ? { ...t, score: t.score + n } : t));
    commit({
      phase: 'ready', teams, current: (S.current + 1) % teams.length, cardId: null, turns: S.turns + 1,
      timer: { total: secs(), endsAt: 0, left: secs() }
    }, { type: point ? 'point' : 'nopoint', cardId: S.cardId, team: team.id, n });
  }
  const gotIt = () => { if (['playing', 'paused'].includes(S.phase) && !countingDown()) award(true); };
  const decide = point => { if (S.phase === 'timeup') award(point); };
  const adjust = (id, d) => commit({ teams: S.teams.map(t => (t.id === id ? { ...t, score: Math.max(0, t.score + d) } : t)) }, { type: 'score', team: id, d });
  const setCurrent = i => { if (S.phase === 'ready') commit({ current: clamp(i, 0, S.teams.length - 1) }, { type: 'ready' }); };
  const endGame = () => { if (!['playing', 'paused', 'timeup'].includes(S.phase)) commit({ phase: 'over' }, { type: 'over' }); };
  const keepPlaying = () => commit({ phase: 'ready' }, { type: 'ready' });
  const toSettings = () => commit({ phase: 'setup' }, { type: 'setup' });
  function newGame() {
    commit({ phase: 'setup', teams: S.teams.map(t => ({ ...t, score: 0 })), turns: 0, current: 0, cardId: null, deck: [], deckCats: '' }, { type: 'setup' });
  }

  // ---- setup edits ----
  function setLevel(level) {
    if (level === S.settings.level) return;
    errors = { ...errors, cat: undefined };
    commit({ settings: { ...S.settings, level, cats: allCats(level) }, deck: [], deckCats: '' }, { type: 'setup' });
  }
  function renameTeam(id, name) {
    commit({ teams: S.teams.map(t => (t.id === id ? { ...t, name: name.slice(0, NAME_MAX) } : t)) }, null, { render: false });
    if (errors.team) { errors = { ...errors, team: validate().team }; $('teamErr').textContent = errors.team || ''; }
  }
  function cycleColor(id) {
    const team = S.teams.find(t => t.id === id);
    const used = new Set(S.teams.filter(t => t.id !== id).map(t => t.color));
    const start = TEAM_COLORS.indexOf(team.color);
    const next = TEAM_COLORS.map((_, k) => TEAM_COLORS[(start + k + 1) % TEAM_COLORS.length]).find(c => !used.has(c)) || team.color;
    commit({ teams: S.teams.map(t => (t.id === id ? { ...t, color: next } : t)) });
  }
  function addTeam() {
    if (S.teams.length >= MAX_TEAMS) { errors = { ...errors, team: `You can have up to ${MAX_TEAMS} teams.` }; render(); return; }
    errors = { ...errors, team: undefined };
    commit({ teams: [...S.teams, makeTeam(S.teams)] });
    const inputs = $('teamList').querySelectorAll('input');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }
  function removeTeam(id) {
    if (S.teams.length <= 1) { errors = { ...errors, team: 'You need at least one team.' }; render(); return; }
    const teams = S.teams.filter(t => t.id !== id);
    errors = { ...errors, team: undefined };
    commit({ teams, current: clamp(S.current, 0, teams.length - 1) });
  }
  const setSeconds = n => commit({ settings: { ...S.settings, seconds: n }, timer: { total: n * 1000, endsAt: 0, left: n * 1000 } });
  const setPoints = n => commit({ settings: { ...S.settings, points: clamp(n, 1, MAX_POINTS) } });
  function toggleCat(id) {
    const on = S.settings.cats.includes(id);
    const cats = on ? S.settings.cats.filter(k => k !== id) : [...S.settings.cats, id];
    errors = { ...errors, cat: cats.length ? undefined : errors.cat };
    commit({ settings: { ...S.settings, cats } });
  }

  // ---- render ----
  function render() {
    $('setup').hidden = S.phase !== 'setup';
    $('game').hidden = S.phase === 'setup';
    $('levelBadge').textContent = levelOf(S.settings.level).name;
    if (S.phase === 'setup') renderSetup(); else renderGame();
    updateTimer();
  }
  function renderSetup() {
    const level = S.settings.level;
    $('levelList').replaceChildren(...LEVELS.map(l => {
      const n = Object.values(CARD).filter(c => c.level === l.key).length;
      return h('button', { class: 'level', type: 'button', 'aria-pressed': String(l.key === level), onclick: () => setLevel(l.key) },
        h('span', { class: 'level-name' }, l.name), h('span', { class: 'level-note' }, l.note), h('span', { class: 'level-count' }, n ? `${n} cards` : 'Cards not loaded'));
    }));
    $('teamList').replaceChildren(...S.teams.map((t, i) => h('li', { class: 'team-row' },
      h('button', { class: 'swatch', type: 'button', style: { background: t.color }, 'aria-label': `Change the colour of ${t.name || 'this team'}`, onclick: () => cycleColor(t.id) }),
      h('input', { class: 'field', id: `team-${t.id}`, value: t.name, maxlength: NAME_MAX, autocomplete: 'off', 'aria-label': `Team ${i + 1} name`, oninput: e => renameTeam(t.id, e.target.value) }),
      h('button', { class: 'btn x', type: 'button', 'aria-label': `Remove ${t.name || 'this team'}`, onclick: () => removeTeam(t.id) }, '×'))));
    $('teamErr').textContent = errors.team || '';
    $('timePresets').replaceChildren(...PRESETS.map(([n, label]) =>
      h('button', { class: 'chip', type: 'button', 'aria-pressed': String(S.settings.seconds === n), onclick: () => { $('customSecs').value = ''; $('timeErr').textContent = ''; setSeconds(n); } }, label)));
    if (document.activeElement !== $('customSecs')) $('customSecs').value = PRESETS.some(([n]) => n === S.settings.seconds) ? '' : String(S.settings.seconds);
    $('ptsOut').textContent = String(S.settings.points);
    $('soundOn').checked = S.settings.sound;
    const cats = catsOf(level);
    $('catList').replaceChildren(...cats.map(c => {
      const sample = (c.cards.find(card => card[1]) || ['', '📝'])[1];
      const n = c.cards.filter(card => !S.settings.classOnly || !card[2]).length;
      return h('button', { class: 'cat', type: 'button', 'aria-pressed': String(S.settings.cats.includes(c.id)), style: { '--cat': c.field }, onclick: () => toggleCat(c.id) },
        h('span', { class: 'sw', 'aria-hidden': 'true' }, sample), h('span', { class: 'cat-name' }, c.name), h('span', { class: 'n' }, String(n)));
    }));
    $('cardCount').textContent = `${countInPlay(S.settings)} cards in the game`;
    const extras = Object.values(CARD).filter(c => c.level === level && !c.lesson);
    $('lessonsOnly').checked = S.settings.classOnly;
    $('lessonsHint').textContent = extras.length
      ? `Every card comes from this class's tests, readings and listening, except ${extras.length} easy extras such as ${extras.slice(0, 3).map(c => c.word).join(', ')}. Tick this to leave the extras out.`
      : "Every card in this level comes from the class's own material.";
    $('catErr').textContent = errors.cat || '';
    const midGame = S.turns > 0 || S.teams.some(t => t.score > 0);
    $('startGame').textContent = midGame ? 'Back to the game' : 'Start game';
    $('newGame').hidden = !midGame;
  }
  function action(label, key, cls, fn, afterGo) {
    return h('button', { class: `btn btn-xl ${cls}`, type: 'button', onclick: fn, 'data-after-go': afterGo }, h('span', {}, label), key ? h('kbd', {}, key) : null);
  }
  // Still pictures as images, the same ones the TV shows, so the preview is right without internet too.
  let stills = {};
  const bareCode = pic => [...pic].map(ch => ch.codePointAt(0).toString(16)).filter(c => c !== 'fe0f').join('_');
  fetch('stills.json').then(r => (r.ok ? r.json() : {})).then(m => { stills = m || {}; render(); })
    .catch(() => { /* the preview keeps the emoji font */ });

  function renderGame() {
    const team = S.teams[S.current];
    const card = CARD[S.cardId];
    const live = card && ['playing', 'paused', 'timeup'].includes(S.phase);
    const over = S.phase === 'over';
    $('turnTeam').replaceChildren(...(over ? ['Game over'] : [h('span', { class: 'dot', style: { background: team.color } }), S.phase === 'ready' ? `Up next: ${team.name}` : `Turn: ${team.name}`]));
    $('preview').classList.toggle('empty', !live);
    $('preview').classList.toggle('wordonly', !!(live && !card.pic));
    const svg = live && card.pic && stills[bareCode(card.pic)];
    if (svg) $('pvPic').replaceChildren(h('img', { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, alt: '', width: '96', height: '96' }));
    else $('pvPic').textContent = live ? (card.pic || 'Aa') : '';
    $('pvCat').textContent = live ? `${CAT[card.cat].name} · ${card.lesson ? 'from their lessons' : 'extra word'}` : '';
    $('pvWord').textContent = live ? card.word : over ? winnerLine() : 'The card stays hidden until you start the turn.';
    $('pvMeaning').textContent = live && card.meaning ? `Class meaning: ${card.meaning}` : '';
    const last = S.event && S.event.type;
    const lastTeam = S.event && S.teams.find(t => t.id === S.event.team);
    const before = S.phase === 'ready' && lastTeam && (last === 'point' || last === 'nopoint')
      ? (last === 'point' ? `Point to ${lastTeam.name}. ` : `No point for ${lastTeam.name}. `) : '';
    $('stageMsg').textContent = before + ({
      ready: 'The guesser stands with their back to the TV. Start when they are ready.',
      playing: 'Their team describes the word without saying it.',
      paused: 'Paused. The TV covers the card.',
      timeup: "Time's up. Did they get it?",
      over: 'The final scores are on the TV.'
    }[S.phase] || '');
    $('actions').replaceChildren(...({
      ready: [action('Start turn', 'Space', 'btn-primary', startTurn)],
      playing: [action('They got it', 'Space', 'btn-good', gotIt, true), action('Change card', 'C', '', changeCard, true), action('Pause', 'P', '', pause)],
      paused: [action('Resume', 'P', 'btn-primary', resume), action('They got it', 'Space', 'btn-good', gotIt, true), action('Change card', 'C', '', changeCard, true)],
      timeup: [action('Point', 'Y', 'btn-good', () => decide(true)), action('No point', 'N', 'btn-bad', () => decide(false))],
      over: [action('New game', '', 'btn-primary', newGame), action('Keep playing', '', '', keepPlaying)]
    }[S.phase] || []));
    $('pick').replaceChildren(...(S.phase === 'ready' && S.teams.length > 1 ? [
      h('label', { for: 'pickTeam' }, 'Someone else goes next:'),
      h('select', { class: 'field', id: 'pickTeam', onchange: e => setCurrent(int(e.target.value, 0)) },
        S.teams.map((t, i) => h('option', { value: String(i), selected: i === S.current }, t.name)))
    ] : []));
    $('keys').textContent = S.phase === 'over' ? '' : 'The keys work when no box is selected.';
    $('scoreList').replaceChildren(...S.teams.map((t, i) => h('li', { class: `score-row${i === S.current && !over ? ' now' : ''}`, style: { '--team': t.color } },
      h('span', { class: 'dot', style: { background: t.color } }),
      h('span', { class: 'score-name' }, t.name),
      h('button', { class: 'btn mini', type: 'button', 'aria-label': `Take a point from ${t.name}`, onclick: () => adjust(t.id, -1) }, '−'),
      h('span', { class: 'score-num' }, String(t.score)),
      h('button', { class: 'btn mini', type: 'button', 'aria-label': `Give ${t.name} a point`, onclick: () => adjust(t.id, 1) }, '+'))));
    $('turnsPlayed').textContent = `${S.turns} ${S.turns === 1 ? 'turn' : 'turns'} played`;
    $('toSettings').hidden = !['ready', 'over'].includes(S.phase);
    $('endGame').hidden = S.phase !== 'ready';
  }
  function winnerLine() {
    const top = Math.max(...S.teams.map(t => t.score));
    const leaders = S.teams.filter(t => t.score === top);
    return leaders.length > 1 ? `A tie: ${leaders.map(t => t.name).join(' and ')}` : `${leaders[0].name} won with ${top} ${top === 1 ? 'point' : 'points'}`;
  }
  function updateTimer() {
    const left = timeLeft(S);
    const el = $('tTimer');
    el.textContent = fmt(left);
    el.hidden = S.phase === 'over';
    el.classList.toggle('urgent', S.phase === 'playing' && left <= 10000);
    const wait = countingDown();
    document.querySelectorAll('#actions [data-after-go]').forEach(b => { b.disabled = wait; });
  }
  function updateTvStatus() {
    const on = Date.now() - tvSeen < 5000;
    $('tvStatus').classList.toggle('on', on);
    $('tvStatusText').textContent = on ? 'TV screen connected' : 'TV screen not open';
  }

  // ---- wiring ----
  // On the teacher's own computer (the Desktop copy) the TV opens next to this page; online it opens the published link.
  // On this computer or on the GitHub site, the TV is this same page with #tv. Inside the Claude link the page
  // runs in a frame with its own address, so the TV opens the Claude link instead.
  const onThisComputer = location.protocol === 'file:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const onOwnSite = onThisComputer || location.hostname.endsWith('.github.io');
  const tvLink = () => (onOwnSite ? `${location.href.split('#')[0]}#tv` : TV_LINK);
  $('tvLink').href = tvLink();
  $('copyTv').addEventListener('click', () => {
    const link = tvLink();
    const done = () => { $('copied').textContent = 'TV link copied'; setTimeout(() => { $('copied').textContent = ''; }, 2500); };
    const fail = () => { $('tvLinkText').hidden = false; $('tvLinkText').textContent = link; $('copied').textContent = 'Copy this link:'; };
    try { navigator.clipboard.writeText(link).then(done, fail); } catch (e) { fail(); }
  });
  $('addTeam').addEventListener('click', addTeam);
  $('startGame').addEventListener('click', startGame);
  $('newGame').addEventListener('click', newGame);
  $('ptsDown').addEventListener('click', () => setPoints(S.settings.points - 1));
  $('ptsUp').addEventListener('click', () => setPoints(S.settings.points + 1));
  $('soundOn').addEventListener('change', e => commit({ settings: { ...S.settings, sound: e.target.checked } }));
  $('lessonsOnly').addEventListener('change', e => {
    errors = { ...errors, cat: undefined };
    commit({ settings: { ...S.settings, classOnly: e.target.checked } });
  });
  $('allCats').addEventListener('click', () => { errors = { ...errors, cat: undefined }; commit({ settings: { ...S.settings, cats: allCats(S.settings.level) } }); });
  $('customSecs').addEventListener('input', e => {
    const raw = e.target.value.trim();
    if (!raw) { $('timeErr').textContent = ''; return; }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < MIN_SECS || n > MAX_SECS) { $('timeErr').textContent = `Use a whole number from ${MIN_SECS} to ${MAX_SECS}.`; return; }
    $('timeErr').textContent = '';
    setSeconds(n);
  });
  $('toSettings').addEventListener('click', toSettings);
  $('endGame').addEventListener('click', endGame);

  document.addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    const k = e.key.toLowerCase();
    if ((k === ' ' || k === 'enter') && tag === 'BUTTON') return;
    const keys = {
      ' ': { ready: startTurn, playing: gotIt, paused: gotIt },
      c: { playing: changeCard, paused: changeCard },
      p: { playing: pause, paused: resume },
      y: { timeup: () => decide(true) },
      n: { timeup: () => decide(false) }
    };
    const fn = keys[k] && keys[k][S.phase];
    if (fn) { e.preventDefault(); fn(); }
  });

  function fromTV(msg) {
    if (!msg || typeof msg.t !== 'string') return;
    tvSeen = Date.now();
    if (msg.t === 'hello') send({ t: 'state', s: S });
    else if (msg.t === 'timeup' && S.phase === 'playing' && S.timer.endsAt - Date.now() < 400) timeUp();
    updateTvStatus();
  }
  if (chan) chan.addEventListener('message', e => fromTV(e.data));
  window.addEventListener('storage', e => {
    if (e.key !== TV_KEY || !e.newValue) return;
    try { fromTV(JSON.parse(e.newValue)); } catch (err) { /* a malformed note from another tab is ignored */ }
  });
  window.addEventListener('hashchange', () => location.reload());

  setInterval(() => {
    if (S.phase === 'playing' && S.timer.endsAt <= Date.now()) timeUp();
    updateTimer();
    updateTvStatus();
  }, 200);

  $('teacher').hidden = false;
  store.write(KEY, S);
  send({ t: 'state', s: S });
  render();
})();

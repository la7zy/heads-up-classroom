// The whole TV as one Remotion composition. Every moment is drawn from the current frame:
// the teacher's state says what is happening, the stamped event says when it started.
import { useCurrentFrame } from 'remotion';
import type { Game } from '../game';
import { HU, countingDown, type GameState, type Team } from '../hu';
import { CARD_BOX, JellyCard, type CardMode } from './Card';
import { Background, Block, Confetti, Jar, Logo, Pill, Shout, podiumPlaces } from './Bits';
import { Pal, layoutPals, type Mood } from './Pal';
import { FPS, INK, LEVEL_COLORS, W, WORD, fitSize, sec, textWidth } from './util';

export interface SceneProps { game: Game; reduce: boolean }

const FINISH = sec(2.1);       // how long a point or a miss plays before the next team's screen
const FLOOR = 985;
const BIG = 1e6;

const msToFrames = (ms: number) => Math.round((ms / 1000) * FPS);

/** The team whose turn it is, top left. It never grows past the card's left edge: a long name shrinks and drops the level. */
function TeamTag({ team, level }: { team: Team; level: string }) {
  const room = CARD_BOX.x - CARD_BOX.w / 2 - 48 - 30 - 120; // from the tag's left edge to the card, minus dot and padding
  const levelW = (textWidth(level, 700, WORD) / 100) * 26 + 22;
  const withLevel = fitSize(team.name, 800, WORD, room - levelW, 40) >= 30;
  const size = fitSize(team.name, 800, WORD, withLevel ? room - levelW : room, 40);
  return (
    <div style={{ position: 'absolute', left: 48, top: 52, display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: `6px solid ${INK}`,
      borderRadius: 999, padding: '12px 30px 12px 16px', font: `800 ${size}px/1 ${WORD}`, color: INK, whiteSpace: 'nowrap' }}>
      <span style={{ width: 40, height: 40, borderRadius: '50%', background: team.color, border: `5px solid ${INK}`, flex: 'none' }} />
      {team.name}
      {withLevel && <span style={{ font: `700 26px/1 ${WORD}`, color: '#6B6290', marginLeft: 6 }}>{level}</span>}
    </div>
  );
}

export function TvScene({ game, reduce }: SceneProps) {
  const frame = useCurrentFrame();
  const now = Date.now();
  const s = game.state;
  const hu = HU();

  if (!s) {
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <Background frame={frame} reduce={reduce} tint="#8B5CF6" />
        <Logo frame={frame} reduce={reduce} />
        <Pill text="Waiting for the teacher" y={640} local={BIG} reduce={reduce} />
      </div>
    );
  }

  const level = hu.levelOf(s.settings.level);
  const tint = LEVEL_COLORS[s.settings.level] ?? '#2F6BFF';
  const stamped = game.event;
  let evLocal = stamped ? frame - stamped.frame : BIG;
  if (evLocal < 0) evLocal = BIG; // the endless timeline looped round: treat the event as long finished
  const ev = stamped?.ev;
  const evType = ev && evLocal < BIG ? ev.type : '';
  const teams = s.teams;
  const spots = layoutPals(teams.length, W, FLOOR);
  const current = teams[Math.min(s.current, teams.length - 1)];

  // ---- what the middle of the screen shows ----
  const finishing = (evType === 'point' || evType === 'nopoint') && evLocal < FINISH && ev?.cardId && hu.CARD[ev.cardId];
  const turnTeam = finishing ? teams.find(t => t.id === ev?.team) ?? current : current;
  const turnIndex = teams.indexOf(turnTeam);
  const startAt = s.timer.endsAt - s.timer.total;
  const counting = countingDown(s, now);
  const showCard = !!finishing || (['playing', 'paused', 'timeup'].includes(s.phase) && !!s.cardId && !!hu.CARD[s.cardId] && !counting);

  let look = { x: 960, y: 420 };
  let lookLocal = evLocal;
  const moodOf = new Map<string, Mood>();
  const jumpOf = new Map<string, number>();
  const hopOf = new Map<string, number>();
  let waveLocal: number | undefined;
  const middle: JSX.Element[] = [];

  if (showCard) {
    const id = finishing ? ev!.cardId! : s.cardId!;
    const card = hu.CARD[id];
    const cat = hu.CAT[card.cat];
    let mode: CardMode = 'steady';
    let local = BIG;
    const dealLocal = msToFrames(now - startAt);
    if (finishing) { mode = evType === 'point' ? 'point' : 'miss'; local = evLocal; }
    // Paused before GO: the class never saw this card, so the blanket is already down, with no slide.
    else if (s.phase === 'paused') { mode = 'paused'; local = evType === 'pause' && !s.timer.preGo ? evLocal : BIG; }
    else if (s.phase === 'timeup') { mode = 'timeup'; local = evType === 'timeup' ? evLocal : BIG; }
    else if (evType === 'change' && evLocal < sec(0.8)) { mode = 'flip'; local = evLocal; }
    else if (dealLocal >= 0 && dealLocal < sec(2)) { mode = 'deal'; local = dealLocal; }
    const fromCard = evType === 'change' && ev?.from && hu.CARD[ev.from] ? { card: hu.CARD[ev.from], cat: hu.CAT[hu.CARD[ev.from].cat] } : undefined;
    const spot = spots[turnIndex];
    middle.push(
      <JellyCard key="card" card={card} cat={cat} from={fromCard} mode={mode} local={local} frame={frame} reduce={reduce}
        code={hu.lottieCode(card.pic)} move={hu.motionFor(card)} points={ev?.n}
        target={spot ? { x: spot.x, y: spot.floor - spot.size * 1.3 } : undefined} />
    );
    if (!finishing && s.phase === 'playing' && dealLocal >= 0 && dealLocal < sec(0.7)) middle.push(<Shout key="go" text="GO!" local={dealLocal} reduce={reduce} size={240} y={430} />);
    if (s.phase === 'timeup' && evType === 'timeup' && evLocal < sec(1.6)) middle.push(<Shout key="late" text="TIME'S UP!" local={evLocal} reduce={reduce} color="#FF6F61" size={220} y={420} />);

    const left = hu.timeLeft(s);
    teams.forEach((t, i) => {
      let m: Mood = 'happy';
      if (s.phase === 'paused') m = 'sleep';
      else if (finishing && evType === 'point') m = 'cheer';
      else if (finishing && evType === 'nopoint') m = i === turnIndex ? 'sad' : 'happy';
      else if (s.phase === 'timeup') m = evLocal < sec(1.6) && evType === 'timeup' ? 'gasp' : i === turnIndex ? 'nervous' : 'happy';
      else if (s.phase === 'playing' && i === turnIndex) m = left <= 5000 ? 'scared' : left <= 10000 ? 'nervous' : 'happy';
      moodOf.set(t.id, m);
    });
    if (finishing && evType === 'point') {
      jumpOf.set(turnTeam.id, evLocal - 6);
      teams.forEach((t, i) => { if (t.id !== turnTeam.id) hopOf.set(t.id, evLocal - 14 - i * 6); });
      const sp0 = spots[turnIndex];
      look = sp0 ? { x: sp0.x, y: sp0.floor - sp0.size } : look;
    } else {
      look = { x: CARD_BOX.x, y: CARD_BOX.top + 220 };
      lookLocal = s.phase === 'playing' ? Math.min(evLocal, Math.max(0, msToFrames(now - startAt))) : evLocal;
    }
  } else if (s.phase === 'playing' && counting) {
    const beat = hu.LEAD / 4;
    const msLeft = startAt - now;
    const n = Math.ceil(msLeft / beat);
    if (n <= 3) {
      const local = msToFrames(now - (startAt - n * beat));
      middle.push(<Shout key={`n${n}`} text={String(n)} local={local} reduce={reduce} size={400} y={430} />);
      teams.forEach(t => hopOf.set(t.id, local));
      look = { x: 960, y: 430 };
      lookLocal = local;
    } else {
      middle.push(<Shout key="ready" text={`${current.name}!`} local={evLocal} reduce={reduce} color={current.color} size={190} y={400} />);
    }
  } else if (s.phase === 'ready' || s.phase === 'playing') {
    const local = (evType === 'point' || evType === 'nopoint') ? evLocal - FINISH : evLocal;
    middle.push(<Shout key="up" text={`${current.name}, you're up!`} local={local} reduce={reduce} color={current.color} size={160} y={330} />);
    middle.push(<Pill key="pill" text="Guesser, turn your back to the screen!" y={470} local={local - 8} reduce={reduce} />);
    waveLocal = local;
    const spot = spots[s.current];
    look = spot ? { x: spot.x, y: spot.floor - spot.size * 0.6 } : look;
    lookLocal = local;
    hopOf.set(current.id, local);
  } else if (s.phase === 'setup') {
    middle.push(<Logo key="logo" frame={frame} reduce={reduce} y={210} />);
    middle.push(<Pill key="pill" text={`${level.name} · waiting for the teacher`} y={520} local={BIG} reduce={reduce} />);
    look = { x: 960, y: 330 };
  }

  // ---- the game is over: a podium for the top three ----
  if (s.phase === 'over') {
    return <Podium s={s} frame={frame} evLocal={evType === 'over' ? evLocal : BIG} reduce={reduce} tint={tint} />;
  }

  const playingCard = showCard && !finishing && s.phase !== 'ready';
  const jarLeft = hu.timeLeft(s);
  const whole = Math.ceil(jarLeft / 1000);
  const popLocal = s.phase === 'playing' && whole <= 5 ? msToFrames(whole * 1000 - jarLeft) : BIG;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Background frame={frame} reduce={reduce} tint={tint} />
      {s.phase !== 'setup' && <TeamTag team={turnTeam} level={level.name} />}
      {playingCard && <Jar left={jarLeft} total={s.timer.total} color={turnTeam.color} frame={frame} reduce={reduce} popLocal={popLocal} />}
      {teams.map((t, i) => {
        const spot = spots[i];
        const bump = game.bumps[t.id];
        const bumpLocal = bump ? frame - bump.frame : -1;
        return (
          <Pal key={t.id} name={t.name} color={t.color} score={t.score} x={spot.x} floor={spot.floor} labelMax={spot.labelMax} size={spot.size * (i === turnIndex && s.phase !== 'setup' ? 1.14 : 1)}
            frame={frame} seed={i + 1} reduce={reduce} mood={moodOf.get(t.id) ?? 'happy'} active={i === turnIndex && s.phase !== 'setup'}
            look={look} lookLocal={lookLocal} jumpLocal={jumpOf.get(t.id)} hopLocal={hopOf.get(t.id)} waveLocal={i === s.current ? waveLocal : undefined}
            bump={bump && bumpLocal >= 0 && bumpLocal < sec(1.5) ? { from: bump.from, to: bump.to, local: bumpLocal } : undefined} />
        );
      })}
      {middle}
      {finishing && evType === 'point' && <Confetti local={evLocal} reduce={reduce} kind="cannons" seed={ev!.seq} />}
    </div>
  );
}

function Podium({ s, frame, evLocal, reduce, tint }: { s: GameState; frame: number; evLocal: number; reduce: boolean; tint: string }) {
  const { ranked, placeOf } = podiumPlaces(s.teams);
  const top = ranked.slice(0, 3);
  const leaders = ranked.filter(t => t.score === ranked[0].score);
  const slots = [{ x: 960, h: 300 }, { x: 600, h: 210 }, { x: 1320, h: 150 }];
  const rest = ranked.slice(3);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Background frame={frame} reduce={reduce} tint={tint} />
      <Shout text={leaders.length > 1 ? "It's a tie!" : `${leaders[0].name} win!`} local={evLocal} reduce={reduce} color="#FFE45C" size={170} y={150} />
      {top.map((t, i) => {
        const slot = slots[i];
        const place = placeOf(t);
        const h = slots[Math.min(place - 1, 2)].h;
        const local = evLocal - 20 - i * 12;
        return (
          <div key={t.id}>
            <Block x={slot.x} w={300} h={h} color={t.color} place={place} name={t.name} local={local} reduce={reduce} />
            <Pal name={t.name} color={t.color} score={t.score} x={slot.x} floor={1000 - h} size={170} frame={frame} seed={i + 1} reduce={reduce}
              mood={place === 1 ? 'proud' : 'cheer'} active={false} crown={place === 1} look={{ x: 960, y: 200 }} lookLocal={evLocal} showName={false}
              jumpLocal={local - 10} />
          </div>
        );
      })}
      {rest.length > 0 && (
        <div style={{ position: 'absolute', left: 120, right: 120, top: 262, textAlign: 'center', font: `800 ${Math.max(28, fitSize(rest.map(t => `${t.name} ${t.score}`).join('   ·   '), 800, WORD, W - 240, 34))}px/1.25 ${WORD}`, color: INK }}>
          {rest.map(t => `${t.name} ${t.score}`).join('   ·   ')}
        </div>
      )}
      <Confetti local={evLocal < 1e5 ? evLocal : -1} reduce={reduce} kind="rain" seed={7} />
    </div>
  );
}

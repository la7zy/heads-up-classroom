# Heads Up Classroom

A Heads Up word game for three ESL classes: Beginners101, Elementary and Advanced. Each class has its own cards, made from its own lessons, plus a "Just for laughs" set.

**Play it:** https://la7zy.github.io/heads-up-classroom/

## How to play

1. Open the link on the classroom computer. This is the teacher screen.
2. Set the computer to show a second screen on the TV (Windows key + P, then "Extend").
3. Pick the class, the teams and the time, then press **Start game**.
4. Press **Open TV screen**, drag the new tab onto the TV and press **Start the TV screen**.
5. The guesser stands with their back to the TV. Press **Start turn**: the TV counts 3-2-1-GO and shows the card. The team describes the word without saying it.
6. Press **They got it**, **Change card** or **Pause**. When time runs out, give a point or not.

The teacher screen and the TV must be open in the same browser on the same computer. The keyboard works too: Space starts a turn or gives the point, C changes the card, P pauses, and Y or N answers when time is up.

## What is in this folder

| Path | What it is |
|---|---|
| `index.html` | The page: the teacher screen, and the TV screen when the address ends in `#tv` |
| `teacher.js`, `core.js` | The teacher screen and the parts both screens share |
| `cards.js`, `cards-beginner.js`, `cards-advanced.js` | The three decks |
| `animated.js`, `emoji/` | The animated pictures |
| `stills.json` | Every picture as an image, so cards look right without internet |
| `tv/` | The TV screen, built from `tv-app/` |
| `tv-app/` | The TV screen's source: React and Remotion |

To rebuild the TV after changing `tv-app/src`, run `npm install` once, then `npm run build:site` inside `tv-app/`.

## Credits

See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).

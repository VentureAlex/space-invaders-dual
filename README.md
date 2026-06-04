# Dual Space Invaders

Classic Space Invaders with **two player ships** on one screen — co-op on a single keyboard.

## Controls

| Ship | Move left | Move right | Fire |
|------|-----------|------------|------|
| **Ship 1** (cyan) | `A` | `D` | `W` |
| **Ship 2** (magenta) | `←` | `→` | `↑` |

You share **6 lives**. Clear all invaders to win. If they reach your line or lives hit zero, game over.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
```

Output in `dist/` — deploy to Vercel or any static host.

## Stack

- Vite + vanilla JavaScript + Canvas
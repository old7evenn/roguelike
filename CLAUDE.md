# Roguelike — project instructions

Semester project for a university JavaScript course: [Lab 26 — Procedural Roguelike](https://github.com/rmalkevy/Programming-Practice-Projects/blob/main/labs/lab-26-procedural-roguelike.md).
Solo work, one final defense: 5-minute live demo plus questions. **The author must be able to explain and modify any line live**, so prefer plain, readable code over clever code.

Grading tiers: Basic → 3, Standard (+1 extension challenge) → 4, Advanced (+side quest, public deploy) → 5.

**What to do next:** [docs/ROADMAP.md](docs/ROADMAP.md). Take the first unchecked task, finish it, then tick it off there and in the README checklist.

## Commands

```bash
npm run dev     # Vite dev server
npm test        # Vitest
npm run lint    # Biome (lint + format check); `npm run format` fixes
npm run build   # tsc + vite build
```

CI (`.github/workflows/deploy.yml`) runs lint, tests, and build, then deploys `main` to GitHub Pages: https://old7evenn.github.io/roguelike/

## Architecture

Layers depend downward only: `ui → world/generation → engine`. `world/` must never touch the DOM.

| Layer | Contents |
|---|---|
| `src/engine/` | Game-agnostic building blocks: `Vec`, `Rect`, `Array2D`, `Rng`, `EventBus`, `distanceMap` |
| `src/world/` | Game model: `Game` (turn loop), `Stage`, `Actor`/`Hero`, `Tiles`, `actions/` |
| `src/generation/` | `DungeonGenerator` strategy implementations, `buildLevel` |
| `src/ui/` | `Display` + `CanvasDisplay`, `Ui`, `screens/`, input bindings, `theme` |
| `src/main.ts` | Composition root only |

### Where new things go

- **New thing an actor can do** → a new `Action` subclass in `world/actions/`. If it's triggered by bumping (attack, open door), return `ActionResult.alternate(...)` from `WalkAction` instead of adding input-layer branches.
- **New tile** → an entry in `Tiles` (`world/tile.ts`) plus a glyph in `ui/theme.ts`.
- **New monster or item kind** → data in a Type Object table (`Breed`, `ItemType`), not a subclass per kind.
- **Monster behaviour** → a Strategy object the monster delegates `nextAction` to.
- **New generator** → implement `DungeonGenerator`; exit placement stays in `buildLevel`.
- **World → UI communication** → emit on `game.events` (add the event to `GameEvents`); never import UI from `world/`.
- **New screen** → implement `Screen` in `ui/screens/`; navigate with `ui.goTo(...)`.
- All randomness goes through a seeded `Rng`. Never call `Math.random()` in `world/` or `generation/`; same seed must give the same run.

## Code style

- TypeScript strict with `erasableSyntaxOnly`: no `enum`, no constructor parameter properties. Use `as const` objects and explicit fields.
- One main class per file, kebab-case file names, named exports only.
- Comments in English, only when they explain *why*. Don't restate the code and don't leave tutorial-style comments.
- UI strings are Ukrainian.
- No speculative abstractions: add an interface or pattern when the current task needs it, not "for later".
- No dead code, no commented-out code, no `any`, no non-null `!` where a real check is cheap.
- New `world/` and `generation/` logic gets Vitest tests in `tests/`, including determinism for anything seeded.
- Run `npm run lint && npm test && npx tsc` before declaring work done.

## Git

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `build:`, `ci:`, `chore:`). Split unrelated changes into separate commits.
- Commit and push only when the author asks: pushing to `main` deploys.

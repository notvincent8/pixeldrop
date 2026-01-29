# Pixeldrop

A retro-themed loot drop simulator. Open treasure chests, collect items across rarity tiers, and track your drop statistics.

## Features

- **Loot rolling** with weighted drop rates across 6 rarity tiers (Common, Uncommon, Rare, Epic, Legendary, Mythic)
- **Chest types** (Normal, Rare, Epic)
- **Streak tracking** and hot streak rarity bonuses
- **Timed events** with automatic drop multipliers
- **Pixel-art animations** and particle effects

## Tech Stack

- React 19
- TypeScript
- Vite (Rolldown)
- Tailwind CSS v4
- GSAP
- Zustand (not yet integrated)

## Getting Started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | Run Biome linter |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format code with Biome |

# Atelier Boilerplate

Minimal React + TypeScript setup for animations and experiments.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Always Included

| Package | Purpose |
|---------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite (Rolldown) | Fast dev server & build |
| Tailwind CSS v4 | Styling |
| GSAP + @gsap/react | Animations |
| clsx + tailwind-merge | Class utilities (`cn()`) |
| Biome | Linting & formatting |

## Project Structure

```
src/
  App.tsx           # Entry point
  main.tsx          # React mount
  index.css         # Global styles + Tailwind
  lib/
    cn.ts           # Utility: cn(...classes)
  components/
    Scene.tsx       # Ready-to-use centered container
```

## Quick Install Scripts

Add dependencies without searching for package names:

```bash
# Three.js ecosystem
pnpm add:three           # three + @react-three/fiber + drei + types
pnpm add:three:effects   # postprocessing
pnpm add:three:physics   # rapier physics

# Smooth scroll
pnpm add:lenis

# State management
pnpm add:zustand

# UI primitives (see available components)
pnpm add:radix
# Then: pnpm add @radix-ui/react-dialog @radix-ui/react-tooltip ...
```

## Usage

### Scene Component

The `<Scene>` component is a full-viewport, centered container for quick experiments:

```tsx
import { Scene } from "./components/Scene"

export default function App() {
  return (
    <Scene>
      {/* Your experiment */}
    </Scene>
  )
}
```

Remove or replace it when you need a different layout.

### cn() Utility

Merge Tailwind classes safely:

```tsx
import { cn } from "./lib/cn"

<div className={cn("p-4", isActive && "bg-blue-500", className)} />
```

### GSAP

Already configured with `@gsap/react`:

```tsx
import { useGSAP } from "@gsap/react"
import gsap from "gsap"

function Component() {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.to(".box", { x: 100, duration: 1 })
  }, { scope: container })

  return (
    <div ref={container}>
      <div className="box">Animate me</div>
    </div>
  )
}
```

## Code Quality

```bash
pnpm lint       # Check issues
pnpm lint:fix   # Fix issues
pnpm format     # Format code
```

## Build

```bash
pnpm build      # Production build
pnpm preview    # Preview build locally
```

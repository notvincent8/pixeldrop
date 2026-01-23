# Optional Packages & Patterns

This document covers optional additions you can make to the boilerplate when needed.

## Quick Install Scripts

```bash
pnpm add:three          # Three.js + React Three Fiber + Drei
pnpm add:three:effects  # PostProcessing effects
pnpm add:three:physics  # Rapier physics engine
pnpm add:lenis          # Smooth scrolling
pnpm add:zustand        # State management
pnpm add:leva           # Debug GUI
pnpm add:perf           # Vercel Speed Insights
pnpm add:radix          # Shows usage for Radix UI components
```

---

## Debug GUI (Leva)

Leva provides a debug panel for tweaking values in real-time.

### Install

```bash
pnpm add:leva
```

### Basic Usage

```tsx
import { useControls } from "leva"

const MyComponent = () => {
  const { color, scale } = useControls({
    color: "#ff0000",
    scale: { value: 1, min: 0.1, max: 3, step: 0.1 },
  })

  return <div style={{ background: color, transform: `scale(${scale})` }} />
}
```

### Dev-Only Pattern

To strip Leva from production builds:

```tsx
import { useControls as useControlsImpl, folder } from "leva"

// Only enable in development
const useControls = import.meta.env.DEV
  ? useControlsImpl
  : () => ({}) // No-op in production

export const MyComponent = () => {
  const { debug } = useControls({ debug: false })
  // ...
}
```

### With Three.js

```tsx
import { useControls } from "leva"

const Scene = () => {
  const { position, color } = useControls("Mesh", {
    position: { value: [0, 0, 0], step: 0.1 },
    color: "#00ff00",
  })

  return (
    <mesh position={position}>
      <boxGeometry />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}
```

---

## Performance Monitoring

### Vercel Speed Insights (Production)

```bash
pnpm add:perf
```

```tsx
// main.tsx
import { SpeedInsights } from "@vercel/speed-insights/react"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <SpeedInsights />
  </StrictMode>
)
```

### R3F Perf (Development - Three.js)

For Three.js projects, use `r3f-perf` for FPS/memory monitoring:

```bash
pnpm add r3f-perf
```

```tsx
import { Perf } from "r3f-perf"

const Scene = () => (
  <Canvas>
    {import.meta.env.DEV && <Perf position="top-left" />}
    {/* ... */}
  </Canvas>
)
```

---

## Three.js Patterns

### Asset Preloading

Use Drei's `useProgress` for loading states:

```tsx
import { useProgress, Html } from "@react-three/drei"

const Loader = () => {
  const { progress } = useProgress()
  return <Html center>{progress.toFixed(0)}%</Html>
}

// In your app
<Suspense fallback={<Loader />}>
  <Model />
</Suspense>
```

### Preload on Hover

Preload heavy components before user clicks:

```tsx
import { lazy, Suspense } from "react"

const Heavy3DScene = lazy(() => import("./Heavy3DScene"))

// Preload function
const preloadScene = () => {
  import("./Heavy3DScene")
}

const App = () => (
  <>
    <button onMouseEnter={preloadScene} onClick={() => setShowScene(true)}>
      Enter Experience
    </button>
    {showScene && (
      <Suspense fallback={<Loading />}>
        <Heavy3DScene />
      </Suspense>
    )}
  </>
)
```

### GPU Detection

Adapt quality based on device capabilities:

```bash
pnpm add detect-gpu
```

```tsx
import { useDetectGPU } from "@react-three/drei"

const Scene = () => {
  const gpu = useDetectGPU()

  const quality = gpu?.tier >= 2 ? "high" : "low"

  return (
    <Canvas dpr={quality === "high" ? [1, 2] : 1}>
      {/* ... */}
    </Canvas>
  )
}
```

### Reduced Motion

Respect user's motion preferences:

```tsx
const usePrefersReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return prefersReducedMotion
}

// Usage
const Animation = () => {
  const reducedMotion = usePrefersReducedMotion()

  useGSAP(() => {
    if (reducedMotion) return
    gsap.to(ref.current, { rotation: 360, duration: 2 })
  }, [reducedMotion])
}
```

---

## Lazy Loading Pattern

For code-splitting heavy components:

```tsx
import { lazy, Suspense } from "react"

// Lazy load heavy components
const Canvas3D = lazy(() => import("./components/Canvas3D"))

const App = () => (
  <ErrorBoundary fallback={<p>Failed to load</p>}>
    <Suspense fallback={<Loading />}>
      <Canvas3D />
    </Suspense>
  </ErrorBoundary>
)
```

---

## Smooth Scrolling (Lenis)

```bash
pnpm add:lenis
```

### Basic Setup

```tsx
import Lenis from "lenis"
import { useEffect } from "react"

const useLenis = () => {
  useEffect(() => {
    const lenis = new Lenis()

    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => lenis.destroy()
  }, [])
}

// In App
const App = () => {
  useLenis()
  return <main>{/* ... */}</main>
}
```

### With GSAP ScrollTrigger

```tsx
import Lenis from "lenis"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

useEffect(() => {
  const lenis = new Lenis()

  lenis.on("scroll", ScrollTrigger.update)

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)

  return () => {
    lenis.destroy()
    gsap.ticker.remove(lenis.raf)
  }
}, [])
```

---

## State Management (Zustand)

```bash
pnpm add:zustand
```

### Basic Store

```tsx
// src/stores/useStore.ts
import { create } from "zustand"

interface AppState {
  isLoaded: boolean
  setLoaded: (loaded: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  isLoaded: false,
  setLoaded: (loaded) => set({ isLoaded: loaded }),
}))

// Usage
const Component = () => {
  const isLoaded = useStore((s) => s.isLoaded)
  const setLoaded = useStore((s) => s.setLoaded)
}
```

### Dev-Only Debug

Combine with Leva for debugging state:

```tsx
import { useControls } from "leva"
import { useStore } from "./stores/useStore"

// Dev-only state inspector
if (import.meta.env.DEV) {
  const DebugPanel = () => {
    const state = useStore()
    useControls("State", state, { collapsed: true })
    return null
  }
}
```

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Access in code:

```tsx
const apiUrl = import.meta.env.VITE_API_URL
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD
```

Note: Only variables prefixed with `VITE_` are exposed to client code.
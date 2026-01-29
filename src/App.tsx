import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { lootConfig } from "@/assets/pools.ts"
import useLoot, { type ChestType } from "@/hooks/useLoot.tsx"

export const toPercentage = (value: number, total: number) => {
  return Number.parseFloat((value === 0 ? 0 : (value / total) * 100).toFixed(2))
}

const RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic"] as const
type Rarity = (typeof RARITY_ORDER)[number]

const RARITY_ICONS: Record<Rarity, string> = {
  common: "◇",
  uncommon: "◆",
  rare: "✦",
  epic: "❖",
  legendary: "★",
  mythic: "✧",
}

const getRarityClass = (rarity: string) => `rarity-${rarity}`
const getGlowClass = (rarity: string) => `glow-${rarity}`
const getRarityIdx = (rarity: string) => RARITY_ORDER.indexOf(rarity as Rarity)

const getRevealDelay = (rarity: string): number => {
  const idx = getRarityIdx(rarity)
  if (idx <= 1) return 150
  if (idx === 2) return 350
  if (idx === 3) return 450
  if (idx === 4) return 550
  return 650
}

const PARTICLE_SHAPES = ["particle-diamond", "particle-square", "particle-star"] as const
const generateParticles = (
  rarity: Rarity,
): { x: string; y: string; duration: string; shape: string; delay: string }[] => {
  const idx = getRarityIdx(rarity)
  const count = 6 + idx * 4
  const spread = 40 + idx * 15
  const particles = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const dist = spread + Math.random() * 20
    particles.push({
      x: `${Math.cos(angle) * dist}px`,
      y: `${Math.sin(angle) * dist}px`,
      duration: `${0.6 + Math.random() * 0.4}s`,
      shape: PARTICLE_SHAPES[Math.floor(Math.random() * PARTICLE_SHAPES.length)],
      delay: `${Math.random() * 0.1}s`,
    })
  }
  return particles
}

const App = () => {
  const [count, setCount] = useState(0)
  const [revealedDrops, setRevealedDrops] = useState<{ item: string; isBest: boolean }[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [dropKey, setDropKey] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showDebug, setShowDebug] = useState(false)
  const [activeChest, setActiveChest] = useState<ChestType>("normal")
  const [dropMultiplier, setDropMultiplier] = useState(1)
  const [shakeIntensity, setShakeIntensity] = useState(2)
  const [titleFlash, setTitleFlash] = useState<Rarity | null>(null)
  const [particles, setParticles] = useState<{ rarity: Rarity; items: ReturnType<typeof generateParticles> } | null>(
    null,
  )
  const [streakRare, setStreakRare] = useState(0)
  const [streakEpic, setStreakEpic] = useState(0)
  const [announcement, setAnnouncement] = useState<Rarity | null>(null)
  const [fragments, setFragments] = useState(0)
  const [hotStreakRolls, setHotStreakRolls] = useState(0)
  const [x2RollsLeft, setX2RollsLeft] = useState(0)
  const [nextX2Threshold, setNextX2Threshold] = useState(() => 30 + Math.floor(Math.random() * 31))
  const [totalRollsForEvent, setTotalRollsForEvent] = useState(0)
  const [effectiveChest, setEffectiveChest] = useState<ChestType>("normal")
  const chestRef = useRef<HTMLButtonElement>(null)
  const revealTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const RARE_CHEST_FRAGMENTS = 20
  const EPIC_CHEST_FRAGMENTS = 50

  const observedCounts = useMemo(
    () =>
      new Map<string, number>([
        ["common", 0],
        ["uncommon", 0],
        ["rare", 0],
        ["epic", 0],
        ["legendary", 0],
        ["mythic", 0],
      ]),
    [],
  )

  const { getLoots, getRollCount } = useLoot(lootConfig.pools[0])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") setShowDebug((v) => !v)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    return () => {
      for (const t of revealTimeoutsRef.current) clearTimeout(t)
    }
  }, [])

  const computeObservedDropRates = (items: string[]) => {
    const rollCount = getRollCount()
    setCount(rollCount)
    for (const item of items) {
      observedCounts.set(item, (observedCounts.get(item) ?? 0) + 1)
    }
  }

  const getBestRarity = useCallback((items: string[]): Rarity => {
    let best = 0
    for (const item of items) {
      const idx = getRarityIdx(item)
      if (idx > best) best = idx
    }
    return RARITY_ORDER[best]
  }, [])

  const auraIntensity = useMemo(() => {
    const streak = Math.max(streakRare, streakEpic / 2)
    if (streak < 15) return 0
    return Math.min((streak - 15) / 50, 1)
  }, [streakRare, streakEpic])

  const onLoot = (e: MouseEvent) => {
    e.preventDefault()
    if (isAnimating) return

    for (const t of revealTimeoutsRef.current) clearTimeout(t)
    revealTimeoutsRef.current = []
    setRevealedDrops([])
    setAnnouncement(null)
    setParticles(null)
    setTitleFlash(null)

    setIsAnimating(true)
    setDropKey((k) => k + 1)
    setAttempts((a) => a + 1)

    let chestType: ChestType = activeChest

    if (fragments >= EPIC_CHEST_FRAGMENTS) {
      chestType = "epic"
      setFragments((f) => f - EPIC_CHEST_FRAGMENTS)
    } else if (fragments >= RARE_CHEST_FRAGMENTS) {
      chestType = "rare"
      setFragments((f) => f - RARE_CHEST_FRAGMENTS)
    } else if (activeChest === "normal") {
      const upgradeRoll = Math.random()
      if (upgradeRoll < 0.005) {
        chestType = "epic"
      } else if (upgradeRoll < 0.035) {
        chestType = "rare"
      }
    }
    setEffectiveChest(chestType)

    let multiplier = dropMultiplier
    if (x2RollsLeft > 0) {
      multiplier = Math.max(multiplier, 2)
      setX2RollsLeft((r) => r - 1)
    }

    const newTotalRolls = totalRollsForEvent + 1
    setTotalRollsForEvent(newTotalRolls)
    if (newTotalRolls >= nextX2Threshold && x2RollsLeft <= 0) {
      const duration = 3 + Math.floor(Math.random() * 3)
      setX2RollsLeft(duration)
      setNextX2Threshold(newTotalRolls + 30 + Math.floor(Math.random() * 31))
    }

    setFragments((f) => f + 1)

    const rarityBoost = hotStreakRolls > 0 ? 1.5 : 1
    if (hotStreakRolls > 0) setHotStreakRolls((h) => h - 1)

    const intensity = 1 + Math.random() * 3
    setShakeIntensity(intensity)
    setIsShaking(true)

    const shakeDuration = 500 + Math.random() * 300

    const shakeTimeout = setTimeout(() => {
      setIsShaking(false)

      const items = getLoots({ chestType, multiplier, rarityBoost })
      computeObservedDropRates(items)

      const sorted = [...items].sort((a, b) => getRarityIdx(a) - getRarityIdx(b))
      const bestRarity = getBestRarity(sorted)
      const bestIdx = getRarityIdx(bestRarity)

      if (bestIdx >= 2) {
        setStreakRare(0)
      } else {
        setStreakRare((s) => s + items.length)
      }
      if (bestIdx >= 3) {
        setStreakEpic(0)
      } else {
        setStreakEpic((s) => s + items.length)
      }

      if (bestIdx >= 2) {
        setHotStreakRolls(2 + Math.floor(Math.random() * 2))
      }

      if (chestRef.current) {
        chestRef.current.classList.remove("chest-bounce")
        void chestRef.current.offsetWidth
        chestRef.current.classList.add("chest-bounce")
      }

      let cumulativeDelay = 0
      sorted.forEach((item, i) => {
        const delay = i === 0 ? 100 : getRevealDelay(item)
        cumulativeDelay += delay
        const isBest = i === sorted.length - 1 && bestIdx >= 2
        const isRarePlus = getRarityIdx(item) >= 2

        const t = setTimeout(() => {
          setRevealedDrops((prev) => [...prev, { item, isBest }])

          if (isRarePlus) {
            setTitleFlash(item as Rarity)
          }

          if (isBest) {
            setParticles({ rarity: item as Rarity, items: generateParticles(item as Rarity) })
            setAnnouncement(item as Rarity)
          }
        }, cumulativeDelay)

        revealTimeoutsRef.current.push(t)
      })

      const doneTimeout = setTimeout(() => {
        setIsAnimating(false)
      }, cumulativeDelay + 800)
      revealTimeoutsRef.current.push(doneTimeout)
    }, shakeDuration)

    revealTimeoutsRef.current.push(shakeTimeout)
  }

  const totalObserved = Array.from(observedCounts.values()).reduce((a, b) => a + b, 0)
  const displayChest = isAnimating ? effectiveChest : activeChest
  const chestClassName = displayChest === "rare" ? "chest-rare" : displayChest === "epic" ? "chest-epic" : ""

  const fragmentProgress =
    fragments >= EPIC_CHEST_FRAGMENTS
      ? 1
      : fragments >= RARE_CHEST_FRAGMENTS
        ? (fragments - RARE_CHEST_FRAGMENTS) / (EPIC_CHEST_FRAGMENTS - RARE_CHEST_FRAGMENTS)
        : fragments / RARE_CHEST_FRAGMENTS
  const fragmentLabel =
    fragments >= EPIC_CHEST_FRAGMENTS
      ? "EPIC READY"
      : fragments >= RARE_CHEST_FRAGMENTS
        ? `${fragments}/${EPIC_CHEST_FRAGMENTS}`
        : `${fragments}/${RARE_CHEST_FRAGMENTS}`

  const getItemEmphasisClass = (rarity: string, isBest: boolean) => {
    const classes = []
    const idx = getRarityIdx(rarity)
    if (idx >= 2) classes.push(`drop-item-${rarity}`)
    if (isBest && idx >= 2) classes.push("drop-item-best")
    return classes.join(" ")
  }

  return (
    <div className="relative min-h-svh w-full overflow-hidden" style={{ background: "var(--bg-dark)" }}>
      <div className="scanlines" />

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div
        className="pointer-events-none fixed top-4 left-4 opacity-40"
        style={{ fontFamily: "var(--font-pixel)", color: "var(--border-glow)", fontSize: "10px" }}
      >
        ┌──
      </div>
      <div
        className="pointer-events-none fixed top-4 right-4 opacity-40"
        style={{ fontFamily: "var(--font-pixel)", color: "var(--border-glow)", fontSize: "10px" }}
      >
        ──┐
      </div>
      <div
        className="pointer-events-none fixed bottom-4 left-4 opacity-40"
        style={{ fontFamily: "var(--font-pixel)", color: "var(--border-glow)", fontSize: "10px" }}
      >
        └──
      </div>
      <div
        className="pointer-events-none fixed bottom-4 right-4 opacity-40"
        style={{ fontFamily: "var(--font-pixel)", color: "var(--border-glow)", fontSize: "10px" }}
      >
        ──┘
      </div>

      {(activeChest !== "normal" || dropMultiplier > 1 || x2RollsLeft > 0) && (
        <div
          className="event-banner"
          style={{
            borderColor:
              activeChest === "epic"
                ? "var(--color-epic)"
                : activeChest === "rare"
                  ? "var(--color-rare)"
                  : "var(--color-legendary)",
            color:
              activeChest === "epic"
                ? "var(--color-epic)"
                : activeChest === "rare"
                  ? "var(--color-rare)"
                  : "var(--color-legendary)",
          }}
        >
          {activeChest !== "normal" && `${activeChest.toUpperCase()} CHEST`}
          {activeChest !== "normal" && (dropMultiplier > 1 || x2RollsLeft > 0) && " + "}
          {x2RollsLeft > 0 && `x2 EVENT (${x2RollsLeft})`}
          {x2RollsLeft <= 0 && dropMultiplier > 1 && `x${dropMultiplier} DROPS`}
        </div>
      )}

      <div className="relative z-10 flex min-h-svh flex-col items-center justify-center px-6">
        <div className="text-center mb-10">
          <h1
            key={`title-${dropKey}-${revealedDrops.length}`}
            className={`tracking-widest mb-2 ${titleFlash ? "title-flash" : "flicker"}`}
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "20px",
              color: titleFlash ? `var(--color-${titleFlash})` : "#e8e8ff",
              textShadow: titleFlash
                ? `0 0 20px var(--color-${titleFlash}-glow), 0 0 40px var(--color-${titleFlash}-glow)`
                : "0 0 20px rgba(138, 138, 255, 0.3)",
            }}
          >
            PIXELDROP
          </h1>
          <p
            className="uppercase tracking-[0.3em]"
            style={{ fontFamily: "var(--font-display)", fontSize: "16px", color: "var(--border-glow)" }}
          >
            Loot Simulator
          </p>
        </div>

        <div className="relative flex flex-col items-center">
          <button
            ref={chestRef}
            type="button"
            onClick={onLoot}
            className={`group relative mb-4 ${isShaking ? "" : "float"}`}
            disabled={isAnimating}
            style={
              isShaking
                ? ({ "--shake-intensity": shakeIntensity, "--shake-duration": "0.15s" } as React.CSSProperties)
                : undefined
            }
          >
            <div
              className={`relative px-10 py-8 pixel-border-glow transition-all duration-200 hover:scale-105 active:scale-95 ${isShaking ? "chest-shake" : ""}`}
              style={{ background: "var(--bg-panel)" }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className={`chest-icon ${chestClassName}`}>
                  <div className="chest-lid" />
                  <div className="chest-body">
                    <div className="chest-lock" />
                  </div>
                </div>
                <span
                  className="tracking-widest uppercase"
                  style={{ fontFamily: "var(--font-pixel)", fontSize: "10px", color: "var(--color-legendary)" }}
                >
                  Open
                </span>
              </div>

              <div
                className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ borderColor: "var(--color-legendary)" }}
              />
              <div
                className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ borderColor: "var(--color-legendary)" }}
              />
              <div
                className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ borderColor: "var(--color-legendary)" }}
              />
              <div
                className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ borderColor: "var(--color-legendary)" }}
              />

              {auraIntensity > 0 && (
                <div
                  className="chest-aura active"
                  style={{
                    boxShadow: `0 0 ${12 + auraIntensity * 20}px ${4 + auraIntensity * 8}px rgba(251, 191, 36, ${0.15 + auraIntensity * 0.35})`,
                  }}
                />
              )}
            </div>
          </button>

          <div className="flex gap-6 mb-2">
            <span
              className="text-center"
              style={{ fontFamily: "var(--font-mono)", fontSize: "22px", color: "var(--border-glow)" }}
            >
              Attempts: {attempts}
            </span>
            <span
              className="text-center"
              style={{ fontFamily: "var(--font-mono)", fontSize: "22px", color: "var(--border-glow)" }}
            >
              Rolls: {count}
            </span>
          </div>

          <div className="streak-counters mb-1">
            <span className={streakRare >= 30 ? "streak-hot" : ""}>Rare+: {streakRare} dry</span>
            <span className={streakEpic >= 80 ? "streak-hot" : ""}>Epic+: {streakEpic} dry</span>
            {hotStreakRolls > 0 && (
              <span style={{ color: "var(--color-uncommon)", textShadow: "0 0 8px var(--color-uncommon-glow)" }}>
                HOT x{hotStreakRolls}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-1" style={{ width: "200px" }}>
            <div
              className="flex-1 h-2 relative"
              style={{ background: "var(--bg-dark)", border: "1px solid var(--border-dim)" }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(fragmentProgress * 100, 100)}%`,
                  background: fragments >= RARE_CHEST_FRAGMENTS ? "var(--color-epic)" : "var(--color-rare)",
                  opacity: 0.8,
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "14px",
                color: fragments >= RARE_CHEST_FRAGMENTS ? "var(--color-epic)" : "var(--border-dim)",
                minWidth: "60px",
              }}
            >
              {fragmentLabel}
            </span>
          </div>

          <div className="absolute top-full left-1/2 -translate-x-1/2 w-[520px] flex flex-col items-center pt-4">
            {revealedDrops.length > 0 && (
              <div key={dropKey} className="flex flex-col items-center gap-3">
                <div
                  className="uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-display)", fontSize: "13px", color: "var(--border-glow)" }}
                >
                  ─── Loot Dropped ───
                </div>

                {announcement && (
                  <div
                    className={`rarity-announce uppercase tracking-wider ${getRarityClass(announcement)} ${getGlowClass(announcement)}`}
                    style={{ fontFamily: "var(--font-pixel)", fontSize: "12px" }}
                  >
                    ★ {announcement} DROP! ★
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-2 max-w-md relative">
                  {revealedDrops.map(({ item, isBest }, i) => (
                    <div
                      key={`${dropKey}-${
                        // biome-ignore lint/suspicious/noArrayIndexKey: keyed by dropKey
                        i
                      }`}
                      className={`drop-item px-3 py-1.5 pixel-border ${getRarityClass(item)} ${getGlowClass(item)} ${getItemEmphasisClass(item, isBest)} relative`}
                      style={{
                        background: "var(--bg-panel)",
                        fontFamily: "var(--font-display)",
                        fontSize: "14px",
                      }}
                    >
                      <span className="mr-1">{RARITY_ICONS[item as Rarity]}</span>
                      <span className="capitalize">{item}</span>

                      {isBest && particles && (
                        <div className="particle-container">
                          {particles.items.map((p, pi) => (
                            <div
                              key={`p-${
                                // biome-ignore lint/suspicious/noArrayIndexKey: particles are ephemeral
                                pi
                              }`}
                              className={`particle ${p.shape}`}
                              style={
                                {
                                  "--p-x": p.x,
                                  "--p-y": p.y,
                                  "--p-duration": p.duration,
                                  animationDelay: p.delay,
                                  background: `var(--color-${particles.rarity})`,
                                } as React.CSSProperties
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
          style={{
            fontFamily: "var(--font-pixel)",
            fontSize: "8px",
            color: "var(--border-dim)",
            letterSpacing: "0.2em",
          }}
        >
          ▪ CLICK TO ROLL ▪ COLLECT LOOT ▪ TRACK RATES ▪
        </div>
      </div>

      <div className={`observed-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)}>
          {sidebarOpen ? "›" : "‹"}
        </button>
        <div className="pixel-border" style={{ background: "var(--bg-panel)" }}>
          <div className="px-3 py-2 border-b-2" style={{ borderColor: "var(--border-dim)" }}>
            <h3
              className="tracking-widest uppercase text-center"
              style={{ fontFamily: "var(--font-display)", fontSize: "12px", color: "#c8c8ff" }}
            >
              ◈ Observed ◈
            </h3>
          </div>
          <div className="px-3 py-2">
            {Array.from(observedCounts.entries()).map(([key, value]) => {
              const pct = toPercentage(value, totalObserved)
              return (
                <div
                  key={key}
                  className="flex items-center justify-between py-1 border-b"
                  style={{ borderColor: "color-mix(in srgb, var(--border-dim) 40%, transparent)" }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`${getRarityClass(key)} ${getGlowClass(key)}`}
                      style={{ fontFamily: "var(--font-display)", fontSize: "14px" }}
                    >
                      {RARITY_ICONS[key as Rarity]}
                    </span>
                    <span
                      className={`capitalize ${getRarityClass(key)}`}
                      style={{ fontFamily: "var(--font-display)", fontSize: "14px" }}
                    >
                      {key}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={getRarityClass(key)} style={{ fontFamily: "var(--font-mono)", fontSize: "18px" }}>
                      {value}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "16px",
                        color: "var(--border-glow)",
                        width: "52px",
                        textAlign: "right",
                      }}
                    >
                      {count > 0 ? `${pct.toFixed(1)}%` : "—"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-3 py-1.5 border-t-2 text-center" style={{ borderColor: "var(--border-dim)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", color: "var(--border-glow)" }}>
              Total: {totalObserved}
            </span>
          </div>
        </div>
      </div>

      {showDebug && (
        <div className="debug-panel">
          <h4>⚙ DEV TOOLS [F2]</h4>
          <button
            type="button"
            className={`debug-btn ${activeChest === "normal" ? "active" : ""}`}
            onClick={() => setActiveChest("normal")}
          >
            Normal Chest
          </button>
          <button
            type="button"
            className={`debug-btn ${activeChest === "rare" ? "active" : ""}`}
            onClick={() => setActiveChest("rare")}
          >
            Rare Chest (no common/uncommon)
          </button>
          <button
            type="button"
            className={`debug-btn ${activeChest === "epic" ? "active" : ""}`}
            onClick={() => setActiveChest("epic")}
          >
            Epic Chest (epic+ only)
          </button>
          <div style={{ height: "8px" }} />
          <button
            type="button"
            className={`debug-btn ${dropMultiplier === 1 ? "active" : ""}`}
            onClick={() => setDropMultiplier(1)}
          >
            x1 Drops (normal)
          </button>
          <button
            type="button"
            className={`debug-btn ${dropMultiplier === 2 ? "active" : ""}`}
            onClick={() => setDropMultiplier(2)}
          >
            x2 Drops Event
          </button>
          <button
            type="button"
            className={`debug-btn ${dropMultiplier === 3 ? "active" : ""}`}
            onClick={() => setDropMultiplier(3)}
          >
            x3 Drops Event
          </button>
          <div style={{ height: "8px" }} />
          <button
            type="button"
            className="debug-btn"
            onClick={() => {
              setRevealedDrops([])
              setAttempts(0)
              setCount(0)
              setStreakRare(0)
              setStreakEpic(0)
              setAnnouncement(null)
              setParticles(null)
              setFragments(0)
              setHotStreakRolls(0)
              setX2RollsLeft(0)
              setTotalRollsForEvent(0)
              setNextX2Threshold(30 + Math.floor(Math.random() * 31))
              setEffectiveChest("normal")
              for (const key of observedCounts.keys()) {
                observedCounts.set(key, 0)
              }
              setDropKey((k) => k + 1)
            }}
          >
            Reset Stats
          </button>
        </div>
      )}
    </div>
  )
}

export default App

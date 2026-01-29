import { useCallback, useMemo, useRef } from "react"
import { toPercentage } from "@/App.tsx"
import type { LootPool } from "@/assets/pools.ts"
import { randomInt } from "@/lib/random.ts"

export const POOL_BASE_WEIGHT = 10000
export const MAX_ROLL_COUNT = 10

export type ChestType = "normal" | "rare" | "epic"

export const CHEST_CONFIGS: Record<
  ChestType,
  { excludeRarities: string[]; maxRolls: number; weightOverrides?: Record<string, number> }
> = {
  normal: { excludeRarities: [], maxRolls: MAX_ROLL_COUNT },
  rare: {
    excludeRarities: ["common", "uncommon"],
    maxRolls: 3,
    weightOverrides: {
      rare: 5500,
      epic: 3000,
      legendary: 1400,
      mythic: 100,
    },
  },
  epic: {
    excludeRarities: ["common", "uncommon", "rare"],
    maxRolls: 2,
    weightOverrides: {
      epic: 6500,
      legendary: 3200,
      mythic: 300,
    },
  },
}

const useLoot = (pool: LootPool) => {
  const totalRollsRef = useRef(0)

  const poolSum = useMemo(() => {
    if (!pool?.entries) return 0
    return pool.entries.reduce((acc, entry) => acc + entry.weight, 0)
  }, [pool])

  useMemo(() => {
    if (poolSum > POOL_BASE_WEIGHT) {
      throw new Error(`Pool sum (${poolSum}) exceeds base weight (${POOL_BASE_WEIGHT})`)
    }
  }, [poolSum])

  const getPoolName = useCallback(() => pool?.name ?? "Unknow Pool", [pool])

  const toPercentageChance = useCallback(
    (weight: number) => {
      return toPercentage(weight, poolSum)
    },
    [poolSum],
  )

  const getLootChances = useCallback(() => {
    if (!pool?.entries) return {}

    return pool.entries.reduce(
      (table, entry) => {
        table[entry.name] = toPercentageChance(entry.weight)
        return table
      },
      {} as Record<string, number>,
    )
  }, [pool, toPercentageChance])

  const RARE_PLUS_NAMES = ["rare", "epic", "legendary", "mythic"]

  const getLoot = useCallback(
    (chestType: ChestType = "normal", rarityBoost = 1) => {
      if (!pool?.entries || pool.entries.length === 0) return null

      const config = CHEST_CONFIGS[chestType]
      const filteredEntries = pool.entries.filter((e) => !config.excludeRarities.includes(e.name))

      if (filteredEntries.length === 0) return null

      let entries = config.weightOverrides
        ? filteredEntries.map((e) => ({
            ...e,
            weight: config.weightOverrides![e.name] ?? e.weight,
          }))
        : [...filteredEntries]

      if (rarityBoost > 1) {
        entries = entries.map((e) => ({
          ...e,
          weight: RARE_PLUS_NAMES.includes(e.name) ? Math.round(e.weight * rarityBoost) : e.weight,
        }))
      }

      const sum = entries.reduce((acc, e) => acc + e.weight, 0)
      if (sum === 0) return null

      const roll = Math.random() * sum
      totalRollsRef.current += 1

      let current = 0
      for (const entry of entries) {
        current += entry.weight
        if (roll <= current) return entry.name
      }
      return null
    },
    [pool],
  )

  const getLoots = useCallback(
    (options?: { max?: number; chestType?: ChestType; multiplier?: number; rarityBoost?: number }) => {
      const { max, chestType = "normal", multiplier = 1, rarityBoost = 1 } = options ?? {}
      const config = CHEST_CONFIGS[chestType]
      const maxRolls = max ?? config.maxRolls
      if (maxRolls <= 0) return []

      const baseCount = randomInt(1, maxRolls)
      const reroll = Math.min(Math.round(baseCount * multiplier), maxRolls * 2)

      return new Array(reroll)
        .fill(0)
        .map(() => getLoot(chestType, rarityBoost))
        .filter((item) => item !== null)
    },
    [getLoot],
  )

  const getRollCount = useCallback(() => totalRollsRef.current, [])

  return { getLoot, getPoolName, getLootChances, getLoots, getRollCount }
}

export default useLoot

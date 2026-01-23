import { useCallback, useMemo, useRef } from "react"
import { toPercentage } from "@/App.tsx"
import type { LootPool } from "@/assets/pools.ts"
import { randomInt } from "@/lib/random.ts"

export const POOL_BASE_WEIGHT = 10000
export const MAX_ROLL_COUNT = 16

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

  const getLoot = useCallback(() => {
    if (!pool?.entries || pool.entries.length === 0) return null
    if (poolSum === 0) return null

    const roll = Math.random() * poolSum
    totalRollsRef.current += 1

    let current = 0
    for (const entry of pool.entries) {
      current += entry.weight
      if (roll <= current) return entry.name
    }
    return null
  }, [pool, poolSum])

  const getLoots = useCallback(
    (max?: number) => {
      if (max !== undefined && max <= 0) return []

      const reroll = randomInt(1, max ?? MAX_ROLL_COUNT)

      return new Array(reroll)
        .fill(0)
        .map(() => getLoot())
        .filter((item) => item !== null)
    },
    [getLoot],
  )

  const getRollCount = useCallback(() => totalRollsRef.current, [])

  return { getLoot, getPoolName, getLootChances, getLoots, getRollCount }
}

export default useLoot

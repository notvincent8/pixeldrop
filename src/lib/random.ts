/**
 * Random utilities for procedural generation and creative coding.
 * Uses Math.random() by default, but supports seeded randomness.
 */

/**
 * Returns a random float within a range.
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns Random float between min and max
 * @example randomRange(0, 10) // e.g., 7.234
 * @example randomRange(-1, 1) // e.g., -0.456
 */
export const randomRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min)
}

/**
 * Returns a random integer within a range (inclusive on both ends).
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer between min and max
 * @example randomInt(1, 6) // e.g., 4 (like a dice roll)
 * @example randomInt(0, 100) // e.g., 73
 */
export const randomInt = (min: number, max: number): number => {
  const minCeil = Math.ceil(min)
  const maxFloor = Math.floor(max)
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil
}

/**
 * Picks a random element from an array.
 * @param array - Array to pick from
 * @returns Random element, or undefined if array is empty
 * @example pick(['a', 'b', 'c']) // e.g., 'b'
 * @example pick([1, 2, 3, 4, 5]) // e.g., 3
 */
export const pick = <T>(array: T[]): T | undefined => {
  if (array.length === 0) return undefined
  return array[Math.floor(Math.random() * array.length)]
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 * Returns a new array, does not mutate the original.
 * @param array - Array to shuffle
 * @returns New shuffled array
 * @example shuffle([1, 2, 3, 4, 5]) // e.g., [3, 1, 5, 2, 4]
 */
export const shuffle = <T>(array: T[]): T[] => {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Returns true with a given probability.
 * @param probability - Chance of returning true (0-1)
 * @returns Boolean based on probability
 * @example chance(0.5) // 50% chance of true
 * @example chance(0.1) // 10% chance of true
 * @example chance(1) // always true
 * @example chance(0) // always false
 */
export const chance = (probability: number): boolean => {
  return Math.random() < probability
}

/**
 * Returns either -1 or 1 randomly.
 * Useful for random directions.
 * @returns -1 or 1
 * @example randomSign() // either -1 or 1
 */
export const randomSign = (): number => {
  return Math.random() < 0.5 ? -1 : 1
}

/**
 * Returns a random boolean.
 * @returns true or false
 * @example randomBool() // either true or false
 */
export const randomBool = (): boolean => {
  return Math.random() < 0.5
}

/**
 * Generates a Gaussian (normal) distributed random number.
 * Uses the Box-Muller transform.
 * @param mean - Mean of the distribution (default: 0)
 * @param standardDeviation - Standard deviation (default: 1)
 * @returns Random number following Gaussian distribution
 * @example gaussian() // e.g., 0.234 (centered around 0)
 * @example gaussian(100, 15) // e.g., 112.5 (IQ-like distribution)
 */
export const gaussian = (mean: number = 0, standardDeviation: number = 1): number => {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0 * standardDeviation + mean
}

/**
 * Creates a seeded random number generator.
 * Produces reproducible sequences of random numbers.
 * Uses a simple but effective mulberry32 algorithm.
 * @param seed - Seed value (same seed = same sequence)
 * @returns Function that returns random floats 0-1
 * @example
 * const rng = seededRandom(12345)
 * rng() // always returns the same first value for seed 12345
 * rng() // always returns the same second value
 */
export const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Creates a seeded random utilities object.
 * All random functions use the same seed for reproducible results.
 * @param seed - Seed value
 * @returns Object with seeded versions of random utilities
 * @example
 * const rand = seededUtils(42)
 * rand.range(0, 100) // reproducible random float
 * rand.int(1, 6) // reproducible random int
 * rand.pick(['a', 'b', 'c']) // reproducible random pick
 */
export const seededUtils = (seed: number) => {
  const rng = seededRandom(seed)

  return {
    /** Get raw random 0-1 */
    random: rng,

    /** Random float in range */
    range: (min: number, max: number) => min + rng() * (max - min),

    /** Random integer (inclusive) */
    int: (min: number, max: number) => {
      const minCeil = Math.ceil(min)
      const maxFloor = Math.floor(max)
      return Math.floor(rng() * (maxFloor - minCeil + 1)) + minCeil
    },

    /** Pick random element */
    pick: <T>(array: T[]): T | undefined => {
      if (array.length === 0) return undefined
      return array[Math.floor(rng() * array.length)]
    },

    /** Shuffle array */
    shuffle: <T>(array: T[]): T[] => {
      const result = [...array]
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
      }
      return result
    },

    /** Chance with probability */
    chance: (probability: number) => rng() < probability,
  }
}

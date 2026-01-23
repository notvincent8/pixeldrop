/**
 * Math utilities for animations and creative coding.
 * All functions are pure and have no side effects.
 */

/**
 * Constrains a value between a minimum and maximum.
 * @param value - The value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns The clamped value
 * @example clamp(15, 0, 10) // 10
 * @example clamp(-5, 0, 10) // 0
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two values.
 * @param start - Start value (returned when t = 0)
 * @param end - End value (returned when t = 1)
 * @param t - Interpolation factor (0-1, but can exceed for extrapolation)
 * @returns Interpolated value
 * @example lerp(0, 100, 0.5) // 50
 * @example lerp(0, 100, 1.5) // 150 (extrapolation)
 */
export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t
}

/**
 * Inverse linear interpolation - finds the t value for a given value in a range.
 * @param start - Start of range
 * @param end - End of range
 * @param value - Value to find t for
 * @returns The t value (0-1 if value is within range)
 * @example invLerp(0, 100, 50) // 0.5
 * @example invLerp(0, 100, 150) // 1.5
 */
export const invLerp = (start: number, end: number, value: number): number => {
  if (start === end) return 0
  return (value - start) / (end - start)
}

/**
 * Normalizes a value from a range to 0-1.
 * Alias for invLerp with more intuitive naming.
 * @param value - Value to normalize
 * @param min - Minimum of the range
 * @param max - Maximum of the range
 * @returns Normalized value (0-1 if within range)
 * @example normalize(50, 0, 100) // 0.5
 */
export const normalize = (value: number, min: number, max: number): number => {
  return invLerp(min, max, value)
}

/**
 * Remaps a value from one range to another.
 * Combines invLerp and lerp in one operation.
 * @param value - Value to remap
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Remapped value
 * @example remap(50, 0, 100, 0, 1) // 0.5
 * @example remap(0.5, 0, 1, -100, 100) // 0
 */
export const remap = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number => {
  const t = invLerp(inMin, inMax, value)
  return lerp(outMin, outMax, t)
}

/**
 * Converts degrees to radians.
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 * @example degToRad(180) // Math.PI
 * @example degToRad(90) // Math.PI / 2
 */
export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

/**
 * Converts radians to degrees.
 * @param radians - Angle in radians
 * @returns Angle in degrees
 * @example radToDeg(Math.PI) // 180
 * @example radToDeg(Math.PI / 2) // 90
 */
export const radToDeg = (radians: number): number => {
  return radians * (180 / Math.PI)
}

/**
 * Rounds a number to a specified number of decimal places.
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 0)
 * @returns Rounded number
 * @example roundTo(3.14159, 2) // 3.14
 * @example roundTo(3.5) // 4
 */
export const roundTo = (value: number, decimals: number = 0): number => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Calculates the 2D distance between two points.
 * @param x1 - First point x coordinate
 * @param y1 - First point y coordinate
 * @param x2 - Second point x coordinate
 * @param y2 - Second point y coordinate
 * @returns Distance between the points
 * @example distance(0, 0, 3, 4) // 5
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.hypot(dx, dy)
}

/**
 * Calculates the squared distance between two points.
 * Faster than distance() when you only need to compare distances.
 * @param x1 - First point x coordinate
 * @param y1 - First point y coordinate
 * @param x2 - Second point x coordinate
 * @param y2 - Second point y coordinate
 * @returns Squared distance between the points
 * @example distanceSquared(0, 0, 3, 4) // 25
 */
export const distanceSquared = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}

/**
 * Modulo operation that handles negative numbers correctly.
 * Unlike %, this always returns a positive result.
 * @param n - The dividend
 * @param m - The divisor
 * @returns Positive modulo result
 * @example mod(-1, 5) // 4 (not -1 like % would give)
 * @example mod(7, 5) // 2
 */
export const mod = (n: number, m: number): number => {
  return ((n % m) + m) % m
}

/**
 * Smoothly interpolates between two values using a smoothstep function.
 * Returns 0 when t <= 0, 1 when t >= 1, and a smooth curve between.
 * @param t - Interpolation factor (clamped to 0-1)
 * @returns Smoothed value between 0 and 1
 * @example smoothstep(0.5) // ~0.5 (but with eased curve)
 */
export const smoothstep = (t: number): number => {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

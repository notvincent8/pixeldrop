/**
 * DOM utilities for handling viewport, events, and browser APIs.
 * All functions are designed to be safe for SSR (server-side rendering).
 */

/** Viewport information */
export interface Viewport {
  /** Viewport width in pixels */
  width: number
  /** Viewport height in pixels */
  height: number
  /** Width / height ratio */
  aspectRatio: number
  /** Device pixel ratio (retina displays have dpr > 1) */
  dpr: number
}

/**
 * Gets current viewport information.
 * Safe to call during SSR (returns zeroes).
 * @returns Viewport object with width, height, aspectRatio, and dpr
 * @example
 * const { width, height, dpr } = getViewport()
 * canvas.width = width * dpr
 * canvas.height = height * dpr
 */
export const getViewport = (): Viewport => {
  if (globalThis.window === undefined) {
    return { width: 0, height: 0, aspectRatio: 1, dpr: 1 }
  }

  const width = window.innerWidth
  const height = window.innerHeight

  return {
    width,
    height,
    aspectRatio: width / height,
    dpr: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2 for performance
  }
}

/**
 * Creates a debounced function that delays invoking until after
 * the specified delay has elapsed since the last call.
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel() method
 * @example
 * const debouncedSearch = debounce(search, 300)
 * input.addEventListener('input', debouncedSearch)
 * // Later: debouncedSearch.cancel()
 */
export const debounce = <T extends (...args: Parameters<T>) => void>(fn: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return debounced
}

/**
 * Creates a throttled function that only invokes at most once
 * per specified interval.
 * @param fn - Function to throttle
 * @param limit - Minimum interval between calls in milliseconds
 * @returns Throttled function
 * @example
 * const throttledScroll = throttle(handleScroll, 100)
 * window.addEventListener('scroll', throttledScroll)
 */
export const throttle = <T extends (...args: Parameters<T>) => void>(fn: T, limit: number) => {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCall >= limit) {
      lastCall = now
      fn(...args)
    } else if (!timeoutId) {
      // Schedule a trailing call
      timeoutId = setTimeout(
        () => {
          lastCall = Date.now()
          timeoutId = null
          fn(...args)
        },
        limit - (now - lastCall),
      )
    }
  }

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return throttled
}

/**
 * Subscribes to window resize events with debouncing.
 * @param callback - Function to call on resize
 * @param debounceMs - Debounce delay (default: 100ms)
 * @returns Unsubscribe function
 * @example
 * const unsubscribe = onResize((viewport) => {
 *   console.log('Resized to:', viewport.width, viewport.height)
 * })
 * // Later: unsubscribe()
 */
export const onResize = (callback: (viewport: Viewport) => void, debounceMs: number = 100): (() => void) => {
  if (globalThis.window === undefined) return () => {}

  const handler = debounce(() => {
    callback(getViewport())
  }, debounceMs)

  window.addEventListener("resize", handler)

  // Call immediately with current viewport
  callback(getViewport())

  return () => {
    handler.cancel()
    window.removeEventListener("resize", handler)
  }
}

/**
 * Checks if the user prefers reduced motion.
 * Useful for disabling animations for accessibility.
 * @returns true if user prefers reduced motion
 * @example
 * if (!prefersReducedMotion()) {
 *   gsap.to(element, { x: 100 })
 * }
 */
export const prefersReducedMotion = (): boolean => {
  if (globalThis.window === undefined) return false
  return globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Checks if the device supports touch input.
 * Note: Many devices support both touch and mouse.
 * @returns true if device has touch capability
 * @example
 * if (isTouchDevice()) {
 *   // Use touch events
 * } else {
 *   // Use mouse events
 * }
 */
export const isTouchDevice = (): boolean => {
  if (globalThis.window === undefined) return false
  return "ontouchstart" in globalThis || navigator.maxTouchPoints > 0
}

/**
 * Checks if user prefers dark color scheme.
 * @returns true if user prefers dark mode
 * @example
 * const theme = prefersDarkMode() ? 'dark' : 'light'
 */
export const prefersDarkMode = (): boolean => {
  if (globalThis.window === undefined) return false
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
}

/**
 * Subscribes to color scheme changes.
 * @param callback - Called when color scheme preference changes
 * @returns Unsubscribe function
 * @example
 * const unsubscribe = onColorSchemeChange((isDark) => {
 *   document.body.classList.toggle('dark', isDark)
 * })
 */
export const onColorSchemeChange = (callback: (prefersDark: boolean) => void): (() => void) => {
  if (globalThis.window === undefined) return () => {}

  const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)")

  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches)
  }

  mediaQuery.addEventListener("change", handler)

  // Call immediately with current preference
  callback(mediaQuery.matches)

  return () => {
    mediaQuery.removeEventListener("change", handler)
  }
}

/**
 * Copies text to clipboard.
 * @param text - Text to copy
 * @returns Promise that resolves when copied
 * @example
 * await copyToClipboard('Hello!')
 */
export const copyToClipboard = async (text: string): Promise<void> => {
  if (globalThis.navigator === undefined || !navigator.clipboard) {
    throw new Error("Clipboard API not available")
  }
  await navigator.clipboard.writeText(text)
}

/**
 * Gets the current scroll position.
 * @returns Object with x and y scroll positions
 * @example
 * const { x, y } = getScrollPosition()
 */
export const getScrollPosition = (): { x: number; y: number } => {
  if (globalThis.window === undefined) {
    return { x: 0, y: 0 }
  }
  return {
    x: window.scrollX || window.pageXOffset,
    y: window.scrollY || window.pageYOffset,
  }
}

import type { ReactNode } from "react"
import { cn } from "@/lib/cn.ts"

interface SceneProps {
  children: ReactNode
  className?: string
}

/**
 * Full-viewport centered container for experiments.
 * Handles responsive sizing, centering, and dark background.
 * Remove or replace when not needed.
 */
export const Scene = ({ children, className }: Readonly<SceneProps>) => {
  return (
    <div className={cn("flex min-h-svh w-full items-center justify-center bg-neutral-950 p-4 text-white", className)}>
      {children}
    </div>
  )
}

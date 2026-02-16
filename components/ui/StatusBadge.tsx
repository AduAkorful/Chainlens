"use client"

import { cn } from "@/lib/utils"

type Status = "PENDING" | "INDEXING" | "READY" | "ERROR" | "REFRESHING"

const statusConfig: Record<
  Status,
  { color: string; label: string; animate?: string }
> = {
  PENDING: { color: "bg-gray-400", label: "Pending" },
  INDEXING: {
    color: "bg-accent-cyan",
    label: "Indexing",
    animate: "animate-pulse-cyan",
  },
  READY: { color: "bg-accent-green", label: "Ready" },
  ERROR: { color: "bg-error", label: "Error" },
  REFRESHING: {
    color: "bg-warning",
    label: "Refreshing",
    animate: "animate-pulse-amber",
  },
}

export function StatusBadge({
  status,
  showLabel = true,
  size = "sm",
}: {
  status: Status
  showLabel?: boolean
  size?: "sm" | "md"
}) {
  const config = statusConfig[status] || statusConfig.PENDING
  const dotSize = size === "md" ? "h-2.5 w-2.5" : "h-2 w-2"

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn("rounded-full", dotSize, config.color, config.animate)}
      />
      {showLabel && (
        <span
          className={cn(
            "font-mono text-xs",
            status === "ERROR" ? "text-error" : "text-text-secondary"
          )}
        >
          {config.label}
        </span>
      )}
    </div>
  )
}

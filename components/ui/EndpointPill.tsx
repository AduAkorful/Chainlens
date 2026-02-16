"use client"

import { CopyButton } from "./CopyButton"
import { cn } from "@/lib/utils"

export function EndpointPill({
  endpoint,
  className,
}: {
  endpoint: string
  className?: string
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const fullUrl = `${appUrl}/api/mcp/${endpoint}`

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-accent-cyan/10 px-3 py-1 border border-accent-cyan/20",
        className
      )}
    >
      <code className="text-xs font-mono text-accent-cyan truncate max-w-[200px]">
        {endpoint}
      </code>
      <CopyButton text={fullUrl} />
    </div>
  )
}

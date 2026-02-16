"use client"

import { Globe, Github, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const typeConfig = {
  URL: { icon: Globe, color: "text-accent-cyan", bg: "bg-accent-cyan/10", label: "URL" },
  GITHUB_REPO: { icon: Github, color: "text-accent-purple", bg: "bg-accent-purple/10", label: "GitHub" },
  PDF: { icon: FileText, color: "text-accent-green", bg: "bg-accent-green/10", label: "PDF" },
}

export function SourceTypeIcon({
  type,
  size = "md",
  showLabel = false,
}: {
  type: "URL" | "GITHUB_REPO" | "PDF"
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}) {
  const config = typeConfig[type] || typeConfig.URL
  const iconSize = size === "lg" ? "h-6 w-6" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"
  const padding = size === "lg" ? "p-3" : size === "md" ? "p-2" : "p-1.5"
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2">
      <div className={cn("rounded-lg", config.bg, padding)}>
        <Icon className={cn(iconSize, config.color)} />
      </div>
      {showLabel && (
        <span className={cn("text-xs font-mono", config.color)}>
          {config.label}
        </span>
      )}
    </div>
  )
}

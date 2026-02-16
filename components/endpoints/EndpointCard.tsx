"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { CopyButton } from "@/components/ui/CopyButton"
import { cn } from "@/lib/utils"

interface EndpointCardProps {
  label: string
  icon?: string
  scope: "section" | "subsection" | "source"
  endpoint: string
  sources: { name: string; status: string; chunkCount: number }[]
  totalChunks: number
  lastIndexed?: string | null
  index: number
}

export function EndpointCard({
  label,
  icon,
  scope,
  endpoint,
  sources,
  totalChunks,
  lastIndexed,
  index,
}: EndpointCardProps) {
  const [expanded, setExpanded] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const fullUrl = `${appUrl}/api/mcp/${endpoint}`
  const readySources = sources.filter((s) => s.status === "READY")

  const cursorSnippet = JSON.stringify(
    {
      mcpServers: {
        [`chainlens-${endpoint}`]: {
          url: fullUrl,
          transport: "http",
        },
      },
    },
    null,
    2
  )

  const scopeColors = {
    section: "border-accent-purple/20 bg-accent-purple/5",
    subsection: "border-accent-cyan/20 bg-accent-cyan/5",
    source: "border-accent-green/20 bg-accent-green/5",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "rounded-xl border bg-surface overflow-hidden card-hover",
        scopeColors[scope]
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {icon && <span className="text-lg">{icon}</span>}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary">{label}</span>
              <span className="text-xs font-mono text-text-secondary capitalize rounded-full bg-elevated px-2 py-0.5">
                {scope}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
              <span>
                {readySources.length}/{sources.length} sources ready
              </span>
              <span>{totalChunks} chunks</span>
              {lastIndexed && (
                <span>
                  Last: {new Date(lastIndexed).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          {readySources.length > 0 ? (
            <StatusBadge status="READY" />
          ) : (
            <StatusBadge status="PENDING" />
          )}
        </div>

        {/* Endpoint URL */}
        <div className="flex items-center gap-2 rounded-lg bg-elevated/50 px-3 py-2 mb-3">
          <code className="flex-1 text-xs font-mono text-accent-cyan truncate">
            {fullUrl}
          </code>
          <CopyButton text={fullUrl} />
        </div>

        {/* Cursor config snippet */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-accent-cyan transition-colors"
        >
          Cursor config snippet
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>

        {expanded && (
          <div className="mt-2 relative">
            <pre className="rounded-lg bg-[#0d0d18] p-3 text-xs font-mono text-text-secondary overflow-x-auto">
              {cursorSnippet}
            </pre>
            <div className="absolute top-2 right-2">
              <CopyButton text={cursorSnippet} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

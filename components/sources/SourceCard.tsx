"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ExternalLink } from "lucide-react"
import { SourceTypeIcon } from "./SourceTypeIcon"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { EndpointPill } from "@/components/ui/EndpointPill"

interface SourceCardProps {
  source: {
    id: string
    name: string
    type: "URL" | "GITHUB_REPO" | "PDF"
    url: string | null
    version: string | null
    status: "PENDING" | "INDEXING" | "READY" | "ERROR" | "REFRESHING"
    chunkCount: number
    mcpEndpoint: string
    section?: { id: string; name: string } | null
    subsection?: { id: string; name: string } | null
    lastIndexedAt: string | null
  }
  index: number
}

export function SourceCard({ source, index }: SourceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={`/sources/${source.id}`}
        className="flex items-center gap-4 rounded-xl border border-border-subtle bg-surface p-4 card-hover group"
      >
        <SourceTypeIcon type={source.type} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary truncate">
              {source.name}
            </span>
            {source.version && (
              <span className="rounded-full bg-accent-cyan/10 px-2 py-0.5 text-xs font-mono text-accent-cyan">
                {source.version}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {(source.section || source.subsection) && (
              <span className="text-xs text-text-secondary truncate">
                {source.section?.name}
                {source.subsection && ` / ${source.subsection.name}`}
              </span>
            )}
            {source.url && (
              <ExternalLink className="h-3 w-3 text-text-secondary shrink-0" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <StatusBadge status={source.status} />
          <span className="text-xs font-mono text-text-secondary">
            {source.chunkCount} chunks
          </span>
          <div className="hidden lg:block">
            <EndpointPill endpoint={source.mcpEndpoint} />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

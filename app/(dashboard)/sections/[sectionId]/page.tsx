"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { EndpointPill } from "@/components/ui/EndpointPill"
import { motion } from "framer-motion"

export default function SectionDetailPage() {
  const params = useParams()
  const sectionId = params.sectionId as string

  const { data: section, isLoading } = useQuery({
    queryKey: ["section", sectionId],
    queryFn: async () => {
      const res = await fetch(`/api/sections/${sectionId}`)
      if (!res.ok) throw new Error("Failed to fetch section")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
      </div>
    )
  }

  if (!section) {
    return (
      <div className="py-20 text-center text-text-secondary">
        Section not found.
      </div>
    )
  }

  const allSources = [
    ...section.sources,
    ...section.subsections.flatMap((s: any) => s.sources),
  ]

  return (
    <div className="space-y-6">
      <Link
        href="/sections"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent-cyan transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sections
      </Link>

      <div className="flex items-center gap-4">
        <span className="text-3xl">{section.icon || "📁"}</span>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            {section.name}
          </h1>
          {section.description && (
            <p className="text-sm text-text-secondary mt-1">
              {section.description}
            </p>
          )}
        </div>
        <div className="ml-auto">
          <EndpointPill endpoint={section.mcpEndpoint} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="text-2xl font-bold text-accent-cyan">
            {section.subsections.length}
          </div>
          <div className="text-sm text-text-secondary">Subsections</div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="text-2xl font-bold text-accent-green">
            {allSources.length}
          </div>
          <div className="text-sm text-text-secondary">Total Sources</div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="text-2xl font-bold text-accent-purple">
            {allSources.reduce((a: number, s: any) => a + (s.chunkCount || 0), 0)}
          </div>
          <div className="text-sm text-text-secondary">Total Chunks</div>
        </div>
      </div>

      {/* Sources directly under this section */}
      {section.sources.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-lg text-text-primary mb-3">
            Direct Sources
          </h2>
          <div className="space-y-2">
            {section.sources.map((source: any, i: number) => (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/sources/${source.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface p-3 card-hover"
                >
                  <StatusBadge status={source.status} />
                  <span className="text-sm font-medium text-text-primary">
                    {source.name}
                  </span>
                  {source.url && (
                    <ExternalLink className="h-3 w-3 text-text-secondary" />
                  )}
                  <span className="ml-auto text-xs font-mono text-text-secondary">
                    {source.chunkCount} chunks
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Subsections */}
      {section.subsections.map((sub: any) => (
        <div key={sub.id}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">{sub.icon || "📂"}</span>
            <h2 className="font-display font-bold text-lg text-text-primary">
              {sub.name}
            </h2>
            <EndpointPill endpoint={sub.mcpEndpoint} />
          </div>
          <div className="space-y-2">
            {sub.sources.map((source: any, i: number) => (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/sources/${source.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface p-3 card-hover"
                >
                  <StatusBadge status={source.status} />
                  <span className="text-sm font-medium text-text-primary">
                    {source.name}
                  </span>
                  <span className="ml-auto text-xs font-mono text-text-secondary">
                    {source.chunkCount} chunks
                  </span>
                </Link>
              </motion.div>
            ))}
            {sub.sources.length === 0 && (
              <p className="text-sm text-text-secondary pl-9">
                No sources yet.
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

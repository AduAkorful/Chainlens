"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ExternalLink,
  RefreshCcw,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { SourceTypeIcon } from "@/components/sources/SourceTypeIcon"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { EndpointPill } from "@/components/ui/EndpointPill"
import { IndexingProgress } from "@/components/sources/IndexingProgress"
import { DeleteConfirmModal } from "@/components/sections/DeleteConfirmModal"

export default function SourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const sourceId = params.sourceId as string

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [errorExpanded, setErrorExpanded] = useState(false)

  const { data: source, isLoading } = useQuery({
    queryKey: ["source", sourceId],
    queryFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}`)
      if (!res.ok) throw new Error("Failed to fetch source")
      return res.json()
    },
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === "INDEXING" || data?.status === "REFRESHING")
        return 3000
      return false
    },
  })

  const reindex = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}/reindex`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to trigger reindex")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["source", sourceId] })
      toast.success("Reindex job queued")
    },
    onError: () => toast.error("Failed to trigger reindex"),
  })

  const deleteSource = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sources/${sourceId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete source")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sources"] })
      queryClient.invalidateQueries({ queryKey: ["sections"] })
      toast.success(
        `Deleted "${data.sourceName}" — ${data.chunksRemoved} chunks removed`
      )
      router.push("/sources")
    },
    onError: () => toast.error("Failed to delete source"),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
      </div>
    )
  }

  if (!source) {
    return (
      <div className="py-20 text-center text-text-secondary">
        Source not found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/sources"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent-cyan transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sources
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <SourceTypeIcon type={source.type} size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-text-primary">
              {source.name}
            </h1>
            {source.version && (
              <span className="rounded-full bg-accent-cyan/10 px-2 py-0.5 text-xs font-mono text-accent-cyan">
                {source.version}
              </span>
            )}
            <StatusBadge status={source.status} size="md" />
          </div>
          {(source.section || source.subsection) && (
            <div className="flex items-center gap-1 mt-1 text-sm text-text-secondary">
              {source.section && (
                <Link
                  href={`/sections/${source.section.id}`}
                  className="hover:text-accent-cyan transition-colors"
                >
                  {source.section.name}
                </Link>
              )}
              {source.subsection && (
                <>
                  <span>/</span>
                  <span>{source.subsection.name}</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => reindex.mutate()}
            disabled={
              source.status === "INDEXING" || source.status === "REFRESHING"
            }
            className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary hover:text-accent-cyan hover:border-accent-cyan/30 disabled:opacity-50 transition-all"
          >
            <RefreshCcw className="h-4 w-4" />
            Reindex
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary hover:text-error hover:border-error/30 transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Indexing progress */}
      <IndexingProgress
        status={source.status}
        chunkCount={source.chunkCount}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="text-xs text-text-secondary mb-1">MCP Endpoint</div>
          <EndpointPill endpoint={source.mcpEndpoint} />
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="text-xs text-text-secondary mb-1">Chunks</div>
          <div className="text-2xl font-bold text-accent-cyan font-mono">
            {source.chunkCount}
          </div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="text-xs text-text-secondary mb-1">Last Indexed</div>
          <div className="text-sm font-medium text-text-primary">
            {source.lastIndexedAt
              ? new Date(source.lastIndexedAt).toLocaleString()
              : "Never"}
          </div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="text-xs text-text-secondary mb-1">Refresh</div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary capitalize">
              {source.refreshCron || "None"}
            </span>
          </div>
        </div>
      </div>

      {/* URL */}
      {source.url && (
        <div className="rounded-xl border border-border-subtle bg-surface p-4">
          <div className="text-xs text-text-secondary mb-2">Source URL</div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-accent-cyan hover:underline"
          >
            {source.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Error log */}
      {source.status === "ERROR" && source.errorLog && (
        <div className="rounded-xl border border-error/30 bg-error/5 p-4">
          <button
            onClick={() => setErrorExpanded(!errorExpanded)}
            className="flex items-center gap-2 w-full text-left"
          >
            <span className="text-sm font-medium text-error">Error Log</span>
            {errorExpanded ? (
              <ChevronUp className="h-4 w-4 text-error" />
            ) : (
              <ChevronDown className="h-4 w-4 text-error" />
            )}
          </button>
          {errorExpanded && (
            <pre className="mt-3 text-xs font-mono text-error/80 whitespace-pre-wrap overflow-auto max-h-64">
              {source.errorLog}
            </pre>
          )}
        </div>
      )}

      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteSource.mutateAsync()}
        title="Delete Source"
        resourceName={source.name}
        cascadeCounts={{ chunks: source._count?.chunks || source.chunkCount }}
      />
    </div>
  )
}

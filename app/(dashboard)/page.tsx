"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"
import Link from "next/link"
import {
  Database,
  FolderTree,
  Layers,
  Activity,
  AlertCircle,
  RefreshCcw,
  Plus,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { SourceTypeIcon } from "@/components/sources/SourceTypeIcon"
import { IndexingProgress } from "@/components/sources/IndexingProgress"
import { useAppStore } from "@/lib/store"

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const { setAddSourceModalOpen } = useAppStore()

  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const res = await fetch("/api/sections")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
  })

  const { data: sources = [] } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await fetch("/api/sources")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
    refetchInterval: 5000,
  })

  const reindex = useMutation({
    mutationFn: async (sourceId: string) => {
      const res = await fetch(`/api/sources/${sourceId}/reindex`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to trigger reindex")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] })
      toast.success("Reindex job queued")
    },
  })

  const totalSources = sources.length
  const totalChunks = sources.reduce(
    (a: number, s: any) => a + (s.chunkCount || 0),
    0
  )
  const totalSections = sections.length
  const indexing = sources.filter(
    (s: any) => s.status === "INDEXING" || s.status === "REFRESHING"
  )
  const errors = sources.filter((s: any) => s.status === "ERROR")
  const recent = sources.slice(0, 5)

  const stats = [
    {
      label: "Sources",
      value: totalSources,
      icon: Database,
      color: "text-accent-cyan",
    },
    {
      label: "Chunks",
      value: totalChunks.toLocaleString(),
      icon: Layers,
      color: "text-accent-green",
    },
    {
      label: "Sections",
      value: totalSections,
      icon: FolderTree,
      color: "text-accent-purple",
    },
    {
      label: "Indexing",
      value: indexing.length,
      icon: Activity,
      color: "text-accent-cyan",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border-subtle bg-surface p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-text-secondary">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Active indexing */}
      {indexing.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent-cyan" />
            Active Indexing
          </h2>
          {indexing.map((source: any) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-accent-cyan/20 bg-surface p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <SourceTypeIcon type={source.type} size="sm" />
                <span className="text-sm font-medium text-text-primary">
                  {source.name}
                </span>
                <StatusBadge status={source.status} />
              </div>
              <IndexingProgress
                status={source.status}
                chunkCount={source.chunkCount}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display font-bold text-base text-text-primary flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-error" />
            Errors ({errors.length})
          </h2>
          {errors.map((source: any) => (
            <div
              key={source.id}
              className="flex items-center gap-3 rounded-xl border border-error/20 bg-surface p-4"
            >
              <SourceTypeIcon type={source.type} size="sm" />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  {source.name}
                </span>
                <p className="text-xs text-error mt-0.5 truncate max-w-md">
                  {source.errorLog || "Unknown error"}
                </p>
              </div>
              <button
                onClick={() => reindex.mutate(source.id)}
                className="flex items-center gap-1 rounded-lg border border-error/30 px-3 py-1.5 text-xs text-error hover:bg-error/10 transition-colors"
              >
                <RefreshCcw className="h-3 w-3" />
                Retry
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recent sources */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-text-primary">
            Recent Sources
          </h2>
          <Link
            href="/sources"
            className="text-xs text-text-secondary hover:text-accent-cyan transition-colors"
          >
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-border-subtle bg-surface">
            <Database className="h-10 w-10 text-text-secondary mb-3" />
            <p className="text-sm text-text-secondary mb-3">
              No sources yet. Add your first documentation source.
            </p>
            <button
              onClick={() => setAddSourceModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-black"
            >
              <Plus className="h-4 w-4" />
              Add Source
            </button>
          </div>
        ) : (
          recent.map((source: any, i: number) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/sources/${source.id}`}
                className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface p-3 card-hover"
              >
                <SourceTypeIcon type={source.type} size="sm" />
                <span className="text-sm font-medium text-text-primary flex-1 truncate">
                  {source.name}
                </span>
                <StatusBadge status={source.status} />
                <span className="text-xs font-mono text-text-secondary">
                  {source.chunkCount} chunks
                </span>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import {
  Globe,
  Cpu,
  CheckCircle,
  XCircle,
  Play,
  RefreshCcw,
} from "lucide-react"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { motion } from "framer-motion"

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [indexingAll, setIndexingAll] = useState(false)

  const { data: sources = [] } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await fetch("/api/sources")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
  })

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/api/health")
      if (!res.ok) return { db: false, gemini: false }
      return res.json()
    },
    refetchInterval: 30000,
  })

  const totalChunks = sources.reduce(
    (a: number, s: any) => a + (s.chunkCount || 0),
    0
  )
  const pendingSources = sources.filter((s: any) => s.status === "PENDING")

  const triggerAllPending = async () => {
    setIndexingAll(true)
    try {
      for (const source of pendingSources) {
        await fetch(`/api/sources/${source.id}/reindex`, { method: "POST" })
      }
      queryClient.invalidateQueries({ queryKey: ["sources"] })
      toast.success(`Queued ${pendingSources.length} sources for indexing`)
    } catch {
      toast.error("Failed to trigger indexing")
    } finally {
      setIndexingAll(false)
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return (
    <div className="space-y-6 max-w-3xl">
      {/* App info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border-subtle bg-surface p-6"
      >
        <h2 className="font-display font-bold text-base text-text-primary mb-4">
          Application
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-text-secondary" />
              <span className="text-sm text-text-secondary">App URL</span>
            </div>
            <code className="text-sm font-mono text-accent-cyan">{appUrl}</code>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">Theme</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </motion.div>

      {/* Embedding model */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border border-border-subtle bg-surface p-6"
      >
        <h2 className="font-display font-bold text-base text-text-primary mb-4">
          Embedding Model
        </h2>
        <div className="flex items-center gap-3 rounded-lg bg-elevated p-4">
          <Cpu className="h-5 w-5 text-accent-cyan" />
          <div>
            <div className="text-sm font-medium text-text-primary">
              Voyage AI voyage-code-3
            </div>
            <div className="text-xs text-text-secondary">
              1024 dimensions &middot; 200M tokens free &middot; 2,000 req/min
              &middot; code-optimized
            </div>
          </div>
        </div>
      </motion.div>

      {/* Connection health */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border-subtle bg-surface p-6"
      >
        <h2 className="font-display font-bold text-base text-text-primary mb-4">
          Connection Health
        </h2>
        <div className="space-y-3">
          <HealthCheck
            label="Supabase Database"
            status={health?.db ?? null}
          />
          <HealthCheck
            label="Voyage AI"
            status={health?.voyage ?? null}
          />
          <HealthCheck
            label="Inngest"
            status={health?.inngest ?? null}
          />
        </div>
      </motion.div>

      {/* Index all pending */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border-subtle bg-surface p-6"
      >
        <h2 className="font-display font-bold text-base text-text-primary mb-2">
          Trigger Indexing
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          {pendingSources.length} source{pendingSources.length !== 1 ? "s" : ""}{" "}
          in PENDING state.
        </p>
        <button
          onClick={triggerAllPending}
          disabled={pendingSources.length === 0 || indexingAll}
          className="flex items-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-black disabled:opacity-50 transition-all hover:bg-accent-cyan/90"
        >
          <Play className="h-4 w-4" />
          {indexingAll
            ? "Queueing..."
            : `Index All Pending Sources (${pendingSources.length})`}
        </button>
      </motion.div>

      {/* Storage stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-border-subtle bg-surface p-6"
      >
        <h2 className="font-display font-bold text-base text-text-primary mb-4">
          Storage
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-elevated p-4">
            <div className="text-2xl font-bold font-mono text-accent-cyan">
              {totalChunks.toLocaleString()}
            </div>
            <div className="text-xs text-text-secondary">Total chunks</div>
          </div>
          <div className="rounded-lg bg-elevated p-4">
            <div className="text-2xl font-bold font-mono text-accent-green">
              {sources.length}
            </div>
            <div className="text-xs text-text-secondary">Total sources</div>
          </div>
        </div>
        <p className="text-xs text-text-secondary mt-3">
          Supabase free tier: 500MB. Monitor usage in the Supabase dashboard.
        </p>
      </motion.div>
    </div>
  )
}

function HealthCheck({
  label,
  status,
}: {
  label: string
  status: boolean | null
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-elevated p-3">
      <span className="text-sm text-text-primary">{label}</span>
      {status === null ? (
        <RefreshCcw className="h-4 w-4 text-text-secondary animate-spin" />
      ) : status ? (
        <CheckCircle className="h-4 w-4 text-accent-green" />
      ) : (
        <XCircle className="h-4 w-4 text-error" />
      )}
    </div>
  )
}

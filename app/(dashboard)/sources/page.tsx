"use client"

import { useQuery } from "@tanstack/react-query"
import { SourceCard } from "@/components/sources/SourceCard"
import { useAppStore } from "@/lib/store"
import { Database, Plus } from "lucide-react"

export default function SourcesPage() {
  const { setAddSourceModalOpen } = useAppStore()

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await fetch("/api/sources")
      if (!res.ok) throw new Error("Failed to fetch sources")
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">
          {sources.length} documentation source{sources.length !== 1 ? "s" : ""}{" "}
          configured
        </p>
      </div>

      {sources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-xl bg-surface border border-border-subtle p-8">
            <Database className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-text-primary mb-2">
              No sources yet
            </h3>
            <p className="text-sm text-text-secondary mb-4 max-w-sm">
              Add your first documentation source to start building your
              knowledge base. You can add URLs, GitHub repos, or PDFs.
            </p>
            <button
              onClick={() => setAddSourceModalOpen(true)}
              className="flex items-center gap-2 mx-auto rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-black transition-all hover:bg-accent-cyan/90"
            >
              <Plus className="h-4 w-4" />
              Add Your First Source
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((source: any, i: number) => (
            <SourceCard key={source.id} source={source} index={i} />
          ))}
        </div>
      )}

    </div>
  )
}

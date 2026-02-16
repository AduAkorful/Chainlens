"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
import { Copy, Check, Plug } from "lucide-react"
import { EndpointCard } from "@/components/endpoints/EndpointCard"

export default function EndpointsPage() {
  const [copiedAll, setCopiedAll] = useState(false)

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const res = await fetch("/api/sections")
      if (!res.ok) throw new Error("Failed to fetch sections")
      return res.json()
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const generateFullConfig = () => {
    const config: Record<string, any> = {}

    for (const section of sections) {
      config[`chainlens-${section.mcpEndpoint}`] = {
        url: `${appUrl}/api/mcp/${section.mcpEndpoint}`,
        transport: "http",
      }

      for (const sub of section.subsections || []) {
        config[`chainlens-${sub.mcpEndpoint}`] = {
          url: `${appUrl}/api/mcp/${sub.mcpEndpoint}`,
          transport: "http",
        }
      }
    }

    return JSON.stringify({ mcpServers: config }, null, 2)
  }

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(generateFullConfig())
    setCopiedAll(true)
    toast.success("Full MCP config copied to clipboard")
    setTimeout(() => setCopiedAll(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
      </div>
    )
  }

  let cardIndex = 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">
          Copy endpoint URLs into your Cursor MCP config for AI-powered
          documentation queries.
        </p>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-2 rounded-lg border border-accent-cyan/30 px-4 py-2 text-sm text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
        >
          {copiedAll ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy All Endpoints
            </>
          )}
        </button>
      </div>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-xl bg-surface border border-border-subtle p-8">
            <Plug className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg text-text-primary mb-2">
              No endpoints yet
            </h3>
            <p className="text-sm text-text-secondary max-w-sm">
              Create sections and add documentation sources to generate MCP endpoints.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section: any) => {
            const allSources = [
              ...(section.sources || []),
              ...(section.subsections || []).flatMap(
                (s: any) => s.sources || []
              ),
            ]

            return (
              <div key={section.id} className="space-y-3">
                <h2 className="font-display font-bold text-lg text-text-primary flex items-center gap-2">
                  <span>{section.icon || "📁"}</span>
                  {section.name}
                </h2>

                {/* Section-level endpoint */}
                <EndpointCard
                  label={section.name}
                  icon={section.icon}
                  scope="section"
                  endpoint={section.mcpEndpoint}
                  sources={allSources}
                  totalChunks={allSources.reduce(
                    (a: number, s: any) => a + (s.chunkCount || 0),
                    0
                  )}
                  index={cardIndex++}
                />

                {/* Subsection-level endpoints */}
                {(section.subsections || []).map((sub: any) => (
                  <EndpointCard
                    key={sub.id}
                    label={sub.name}
                    icon={sub.icon}
                    scope="subsection"
                    endpoint={sub.mcpEndpoint}
                    sources={sub.sources || []}
                    totalChunks={(sub.sources || []).reduce(
                      (a: number, s: any) => a + (s.chunkCount || 0),
                      0
                    )}
                    index={cardIndex++}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

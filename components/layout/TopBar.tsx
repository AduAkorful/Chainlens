"use client"

import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/sections": "Sections & Subsections",
  "/sources": "Documentation Sources",
  "/endpoints": "MCP Endpoints",
  "/settings": "Settings",
}

function getBreadcrumb(pathname: string): string[] {
  if (pathname === "/") return ["Overview"]
  const parts = pathname.split("/").filter(Boolean)
  return parts.map((p) =>
    p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " ")
  )
}

export function TopBar() {
  const pathname = usePathname()
  const { setAddSourceModalOpen, sidebarCollapsed } = useAppStore()
  const title = pageTitles[pathname] || getBreadcrumb(pathname).pop() || "ChainLens"
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6",
        "bg-background/80 backdrop-blur-md border-border-subtle",
        "transition-all duration-300",
        sidebarCollapsed ? "ml-14" : "ml-60"
      )}
    >
      <div className="flex items-center gap-3">
        <div>
          {breadcrumb.length > 1 && (
            <div className="flex items-center gap-1 text-xs text-text-secondary mb-0.5">
              {breadcrumb.map((part, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="opacity-50">/</span>}
                  <span>{part}</span>
                </span>
              ))}
            </div>
          )}
          <h1 className="font-display font-bold text-lg text-text-primary">
            {title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={() => setAddSourceModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-black transition-all hover:bg-accent-cyan/90 hover:shadow-lg hover:shadow-accent-cyan/20"
        >
          <Plus className="h-4 w-4" />
          Add Source
        </button>
      </div>
    </header>
  )
}

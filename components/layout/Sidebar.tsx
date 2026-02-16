"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  FolderTree,
  Database,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/sections", label: "Sections", icon: FolderTree },
  { href: "/sources", label: "Sources", icon: Database },
  { href: "/endpoints", label: "Endpoints", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, setAddSourceModalOpen } =
    useAppStore()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r transition-all duration-300",
        "bg-surface border-border-subtle",
        sidebarCollapsed ? "w-14" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-3 border-b border-border-subtle">
        <AnimatePresence mode="wait">
          {!sidebarCollapsed ? (
            <motion.div
              key="full-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 300 300" className="opacity-90">
                  <polygon
                    points="150,50 236,100 236,200 150,250 64,200 64,100"
                    fill="none"
                    stroke="#00d4ff"
                    strokeWidth="18"
                  />
                  <circle cx="150" cy="150" r="42" fill="none" stroke="#00d4ff" strokeWidth="12" opacity="0.5" />
                  <circle cx="150" cy="150" r="12" fill="#00ff88" />
                </svg>
              </div>
              <span className="font-display font-bold text-lg">
                <span className="text-text-primary">chain</span>
                <span className="text-accent-cyan">lens</span>
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="icon-only"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center mx-auto"
            >
              <svg width="20" height="20" viewBox="0 0 300 300" className="opacity-90">
                <polygon
                  points="150,50 236,100 236,200 150,250 64,200 64,100"
                  fill="none"
                  stroke="#00d4ff"
                  strokeWidth="18"
                />
                <circle cx="150" cy="150" r="42" fill="none" stroke="#00d4ff" strokeWidth="12" opacity="0.5" />
                <circle cx="150" cy="150" r="12" fill="#00ff88" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent-cyan/10 text-accent-cyan"
                  : "text-text-secondary hover:text-text-primary hover:bg-elevated"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}

        {/* Add Source shortcut */}
        <button
          onClick={() => setAddSourceModalOpen(true)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors w-full",
            "text-accent-green hover:bg-accent-green/10"
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="truncate"
              >
                Add Source
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border-subtle p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}

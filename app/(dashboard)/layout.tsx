"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { TopBar } from "@/components/layout/TopBar"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main
        className={cn(
          "transition-all duration-300 p-6",
          sidebarCollapsed ? "ml-14" : "ml-60"
        )}
      >
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  )
}

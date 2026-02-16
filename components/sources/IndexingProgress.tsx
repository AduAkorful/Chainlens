"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface IndexingProgressProps {
  status: "PENDING" | "INDEXING" | "READY" | "ERROR" | "REFRESHING"
  chunkCount: number
  className?: string
}

export function IndexingProgress({
  status,
  chunkCount,
  className,
}: IndexingProgressProps) {
  if (status !== "INDEXING" && status !== "REFRESHING") return null

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary">
          {status === "INDEXING" ? "Indexing..." : "Refreshing..."}
        </span>
        <span className="font-mono text-accent-cyan">
          {chunkCount} chunks
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            status === "INDEXING" ? "bg-accent-cyan" : "bg-warning"
          )}
          initial={{ width: "5%" }}
          animate={{ width: "75%" }}
          transition={{ duration: 30, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

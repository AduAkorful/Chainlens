"use client"

import { useEffect, useState } from "react"
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
  const [prevCount, setPrevCount] = useState(chunkCount)
  const [animateCount, setAnimateCount] = useState(false)

  useEffect(() => {
    if (chunkCount !== prevCount) {
      setAnimateCount(true)
      setPrevCount(chunkCount)
      const t = setTimeout(() => setAnimateCount(false), 500)
      return () => clearTimeout(t)
    }
  }, [chunkCount, prevCount])

  if (status !== "INDEXING" && status !== "REFRESHING") return null

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-secondary flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
          </span>
          {status === "INDEXING" ? "Indexing..." : "Refreshing..."}
        </span>
        <motion.span
          className={cn(
            "font-mono tabular-nums",
            animateCount ? "text-accent-green" : "text-accent-cyan"
          )}
          animate={animateCount ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {chunkCount} chunks
        </motion.span>
      </div>
      <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            status === "INDEXING" ? "bg-accent-cyan" : "bg-warning"
          )}
          initial={{ width: "5%" }}
          animate={{ width: chunkCount > 0 ? "75%" : "15%" }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

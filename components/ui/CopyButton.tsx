"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function CopyButton({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-mono transition-colors",
        "text-text-secondary hover:text-accent-cyan hover:bg-accent-cyan/10",
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-accent-green" />
          <span className="text-accent-green">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

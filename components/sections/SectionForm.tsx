"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { generateSlug, sectionEndpoint } from "@/lib/slug"

interface SectionFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    description: string
    icon: string
  }) => Promise<void>
  initial?: { name: string; description: string; icon: string }
  mode: "create" | "edit"
}

const EMOJI_OPTIONS = [
  "🧱", "🛠", "💱", "📋", "🔐", "⚡", "🧪", "🔌", "📦", "🌐",
  "🔗", "💎", "🏗", "📊", "🎯", "🔥", "⛓", "🤖", "📝", "🛡",
]

export function SectionForm({
  open,
  onClose,
  onSubmit,
  initial,
  mode,
}: SectionFormProps) {
  const [name, setName] = useState(initial?.name || "")
  const [description, setDescription] = useState(initial?.description || "")
  const [icon, setIcon] = useState(initial?.icon || "📁")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name || "")
      setDescription(initial?.description || "")
      setIcon(initial?.icon || "📁")
    }
  }, [open, initial])

  const slug = generateSlug(name)
  const endpoint = sectionEndpoint(slug)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ name, description, icon })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Create Section" : "Edit Section"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Icon
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  icon === emoji
                    ? "bg-accent-cyan/20 ring-2 ring-accent-cyan"
                    : "bg-elevated hover:bg-elevated/80"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. DeFi Protocols"
            className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
            required
          />
          {name && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-text-secondary">Slug:</span>
              <code className="text-xs font-mono text-accent-cyan">
                {slug}
              </code>
              <span className="text-xs text-text-secondary ml-2">
                MCP Endpoint:
              </span>
              <code className="text-xs font-mono text-accent-cyan">
                {endpoint}
              </code>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this section..."
            rows={2}
            className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name || loading}
            className="rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-black disabled:opacity-50 transition-all hover:bg-accent-cyan/90"
          >
            {loading
              ? "Saving..."
              : mode === "create"
                ? "Create Section"
                : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

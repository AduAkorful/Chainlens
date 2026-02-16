"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { generateSlug } from "@/lib/slug"

interface SubsectionFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    name: string
    description: string
    icon: string
    sectionId: string
  }) => Promise<void>
  sections: { id: string; name: string; slug: string }[]
  preselectedSectionId?: string
  initial?: { name: string; description: string; icon: string; sectionId: string }
  mode: "create" | "edit"
}

const EMOJI_OPTIONS = [
  "📂", "📄", "🔷", "🔶", "💫", "⭐", "🎯", "🔹", "🔸", "📌",
]

export function SubsectionForm({
  open,
  onClose,
  onSubmit,
  sections,
  preselectedSectionId,
  initial,
  mode,
}: SubsectionFormProps) {
  const [name, setName] = useState(initial?.name || "")
  const [description, setDescription] = useState(initial?.description || "")
  const [icon, setIcon] = useState(initial?.icon || "📂")
  const [sectionId, setSectionId] = useState(
    initial?.sectionId || preselectedSectionId || ""
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name || "")
      setDescription(initial?.description || "")
      setIcon(initial?.icon || "📂")
      setSectionId(initial?.sectionId || preselectedSectionId || "")
    }
  }, [open, initial, preselectedSectionId])

  const slug = generateSlug(name)
  const parentSection = sections.find((s) => s.id === sectionId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({ name, description, icon, sectionId })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Create Subsection" : "Edit Subsection"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Parent Section
          </label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
            required
          >
            <option value="">Select a section...</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

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
            placeholder="e.g. Uniswap V3"
            className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
            required
          />
          {name && parentSection && (
            <div className="mt-2">
              <span className="text-xs text-text-secondary">MCP Endpoint: </span>
              <code className="text-xs font-mono text-accent-cyan">
                sub-{parentSection.slug}-{slug}
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
            placeholder="Brief description..."
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
            disabled={!name || !sectionId || loading}
            className="rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-black disabled:opacity-50 transition-all hover:bg-accent-cyan/90"
          >
            {loading
              ? "Saving..."
              : mode === "create"
                ? "Create Subsection"
                : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

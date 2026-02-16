"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  resourceName: string
  cascadeCounts?: {
    subsections?: number
    sources?: number
    chunks?: number
  }
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  resourceName,
  cascadeCounts,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg bg-error/10 p-4">
          <AlertTriangle className="h-5 w-5 text-error shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-text-primary font-medium">
              Delete &ldquo;{resourceName}&rdquo;?
            </p>
            <p className="text-text-secondary mt-1">
              This will permanently delete
              {cascadeCounts?.subsections !== undefined &&
                cascadeCounts.subsections > 0 &&
                ` ${cascadeCounts.subsections} subsection${cascadeCounts.subsections !== 1 ? "s" : ""},`}
              {cascadeCounts?.sources !== undefined &&
                cascadeCounts.sources > 0 &&
                ` ${cascadeCounts.sources} source${cascadeCounts.sources !== 1 ? "s" : ""},`}
              {cascadeCounts?.chunks !== undefined &&
                cascadeCounts.chunks > 0 &&
                ` ${cascadeCounts.chunks} indexed chunk${cascadeCounts.chunks !== 1 ? "s" : ""}`}
              {cascadeCounts?.chunks !== undefined &&
                cascadeCounts.chunks > 0 &&
                " and their vector embeddings"}
              . This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-all hover:bg-error/90"
          >
            {loading ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

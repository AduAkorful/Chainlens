"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { SectionTree } from "@/components/sections/SectionTree"
import { SectionForm } from "@/components/sections/SectionForm"
import { SubsectionForm } from "@/components/sections/SubsectionForm"
import { DeleteConfirmModal } from "@/components/sections/DeleteConfirmModal"

export default function SectionsPage() {
  const queryClient = useQueryClient()
  const [sectionFormOpen, setSectionFormOpen] = useState(false)
  const [sectionFormMode, setSectionFormMode] = useState<"create" | "edit">("create")
  const [editingSection, setEditingSection] = useState<any>(null)

  const [subsectionFormOpen, setSubsectionFormOpen] = useState(false)
  const [subsectionFormMode, setSubsectionFormMode] = useState<"create" | "edit">("create")
  const [editingSubsection, setEditingSubsection] = useState<any>(null)
  const [preselectedSectionId, setPreselectedSectionId] = useState<string>("")

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean
    type: "section" | "subsection"
    item: any
  }>({ open: false, type: "section", item: null })

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const res = await fetch("/api/sections")
      if (!res.ok) throw new Error("Failed to fetch sections")
      return res.json()
    },
  })

  const createSection = useMutation({
    mutationFn: async (data: { name: string; description: string; icon: string }) => {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create section")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] })
      toast.success("Section created")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateSection = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string; name: string; description: string; icon: string }) => {
      const res = await fetch(`/api/sections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update section")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] })
      toast.success("Section updated")
    },
    onError: () => toast.error("Failed to update section"),
  })

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sections/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete section")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sections"] })
      toast.success(
        `Deleted "${data.sectionName}" — ${data.chunkCount} chunks removed`
      )
    },
    onError: () => toast.error("Failed to delete section"),
  })

  const createSubsection = useMutation({
    mutationFn: async (data: {
      name: string
      description: string
      icon: string
      sectionId: string
    }) => {
      const res = await fetch("/api/subsections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create subsection")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] })
      toast.success("Subsection created")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateSubsection = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: string; name: string; description: string; icon: string; sectionId: string }) => {
      const res = await fetch(`/api/subsections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update subsection")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] })
      toast.success("Subsection updated")
    },
    onError: () => toast.error("Failed to update subsection"),
  })

  const deleteSubsection = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subsections/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete subsection")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sections"] })
      toast.success(
        `Deleted "${data.subsectionName}" — ${data.chunkCount} chunks removed`
      )
    },
    onError: () => toast.error("Failed to delete subsection"),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-cyan border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-sm">
          Organize your documentation into a hierarchical structure. Each level gets its own MCP endpoint.
        </p>
      </div>

      <SectionTree
        sections={sections}
        onCreateSection={() => {
          setSectionFormMode("create")
          setEditingSection(null)
          setSectionFormOpen(true)
        }}
        onEditSection={(section) => {
          setSectionFormMode("edit")
          setEditingSection(section)
          setSectionFormOpen(true)
        }}
        onDeleteSection={(section) => {
          setDeleteModal({ open: true, type: "section", item: section })
        }}
        onCreateSubsection={(sectionId) => {
          setSubsectionFormMode("create")
          setEditingSubsection(null)
          setPreselectedSectionId(sectionId)
          setSubsectionFormOpen(true)
        }}
        onEditSubsection={(subsection) => {
          setSubsectionFormMode("edit")
          setEditingSubsection(subsection)
          setSubsectionFormOpen(true)
        }}
        onDeleteSubsection={(subsection) => {
          setDeleteModal({ open: true, type: "subsection", item: subsection })
        }}
      />

      <SectionForm
        open={sectionFormOpen}
        onClose={() => setSectionFormOpen(false)}
        onSubmit={async (data) => {
          if (sectionFormMode === "create") {
            await createSection.mutateAsync(data)
          } else if (editingSection) {
            await updateSection.mutateAsync({ id: editingSection.id, ...data })
          }
        }}
        initial={
          editingSection
            ? {
                name: editingSection.name,
                description: editingSection.description || "",
                icon: editingSection.icon || "📁",
              }
            : undefined
        }
        mode={sectionFormMode}
      />

      <SubsectionForm
        open={subsectionFormOpen}
        onClose={() => setSubsectionFormOpen(false)}
        onSubmit={async (data) => {
          if (subsectionFormMode === "create") {
            await createSubsection.mutateAsync(data)
          } else if (editingSubsection) {
            await updateSubsection.mutateAsync({
              id: editingSubsection.id,
              ...data,
            })
          }
        }}
        sections={sections.map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
        }))}
        preselectedSectionId={preselectedSectionId}
        initial={
          editingSubsection
            ? {
                name: editingSubsection.name,
                description: editingSubsection.description || "",
                icon: editingSubsection.icon || "📂",
                sectionId: editingSubsection.sectionId,
              }
            : undefined
        }
        mode={subsectionFormMode}
      />

      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        onConfirm={async () => {
          if (deleteModal.type === "section") {
            await deleteSection.mutateAsync(deleteModal.item.id)
          } else {
            await deleteSubsection.mutateAsync(deleteModal.item.id)
          }
        }}
        title={
          deleteModal.type === "section"
            ? "Delete Section"
            : "Delete Subsection"
        }
        resourceName={deleteModal.item?.name || ""}
        cascadeCounts={
          deleteModal.type === "section"
            ? {
                subsections: deleteModal.item?.subsections?.length || 0,
                sources:
                  (deleteModal.item?.sources?.length || 0) +
                  (deleteModal.item?.subsections?.reduce(
                    (a: number, s: any) => a + (s.sources?.length || 0),
                    0
                  ) || 0),
                chunks: 0,
              }
            : {
                sources: deleteModal.item?.sources?.length || 0,
                chunks: 0,
              }
        }
      />
    </div>
  )
}

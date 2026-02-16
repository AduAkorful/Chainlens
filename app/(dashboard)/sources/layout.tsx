"use client"

import { useQuery } from "@tanstack/react-query"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AddSourceModal } from "@/components/sources/AddSourceModal"
import { useAppStore } from "@/lib/store"

export default function SourcesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const queryClient = useQueryClient()
  const { addSourceModalOpen, setAddSourceModalOpen } = useAppStore()

  const { data: sections = [] } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const res = await fetch("/api/sections")
      if (!res.ok) throw new Error("Failed to fetch sections")
      return res.json()
    },
  })

  const createSource = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create source")
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sources"] })
      queryClient.invalidateQueries({ queryKey: ["sections"] })
      toast.success(`Source "${data.name}" added`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <>
      {children}
      <AddSourceModal
        open={addSourceModalOpen}
        onClose={() => setAddSourceModalOpen(false)}
        onSubmit={async (data) => {
          await createSource.mutateAsync(data)
        }}
        sections={sections.map((s: any) => ({
          id: s.id,
          name: s.name,
          subsections:
            s.subsections?.map((sub: any) => ({
              id: sub.id,
              name: sub.name,
            })) || [],
        }))}
      />
    </>
  )
}

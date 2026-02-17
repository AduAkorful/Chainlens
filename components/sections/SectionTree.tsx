"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react"
import { StatusBadge } from "@/components/ui/StatusBadge"
import { EndpointPill } from "@/components/ui/EndpointPill"
import Link from "next/link"

interface Source {
  id: string
  name: string
  status: "PENDING" | "INDEXING" | "READY" | "ERROR" | "REFRESHING"
  chunkCount: number
}

interface Subsection {
  id: string
  name: string
  slug: string
  icon: string | null
  mcpEndpoint: string
  sources: Source[]
}

interface Section {
  id: string
  name: string
  slug: string
  icon: string | null
  mcpEndpoint: string
  subsections: Subsection[]
  sources: Source[]
}

interface SectionTreeProps {
  sections: Section[]
  onCreateSection: () => void
  onEditSection: (section: Section) => void
  onDeleteSection: (section: Section) => void
  onCreateSubsection: (sectionId: string) => void
  onEditSubsection: (subsection: Subsection) => void
  onDeleteSubsection: (subsection: Subsection) => void
  onReorder?: (type: "sections" | "subsections", items: { id: string; order: number }[]) => void
}

export function SectionTree({
  sections,
  onCreateSection,
  onEditSection,
  onDeleteSection,
  onCreateSubsection,
  onEditSubsection,
  onDeleteSubsection,
  onReorder,
}: SectionTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [orderedSections, setOrderedSections] = useState(sections)

  if (
    sections.length !== orderedSections.length ||
    sections.some((s, i) => s.id !== orderedSections[i]?.id)
  ) {
    setOrderedSections(sections)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const getSourceCounts = (section: Section) => {
    const direct = section.sources.length
    const sub = section.subsections.reduce(
      (acc, s) => acc + s.sources.length,
      0
    )
    return direct + sub
  }

  const getAggregateStatus = (sources: Source[]) => {
    if (sources.some((s) => s.status === "ERROR")) return "ERROR"
    if (sources.some((s) => s.status === "INDEXING")) return "INDEXING"
    if (sources.some((s) => s.status === "REFRESHING")) return "REFRESHING"
    if (sources.every((s) => s.status === "READY") && sources.length > 0)
      return "READY"
    return "PENDING"
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = orderedSections.findIndex((s) => s.id === active.id)
      const newIndex = orderedSections.findIndex((s) => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const newOrder = arrayMove(orderedSections, oldIndex, newIndex)
      setOrderedSections(newOrder)

      const items = newOrder.map((s, i) => ({ id: s.id, order: i }))
      onReorder?.("sections", items)
    },
    [orderedSections, onReorder]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedSections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {orderedSections.map((section) => {
            const isExpanded = expanded.has(section.id)
            const allSources = [
              ...section.sources,
              ...section.subsections.flatMap((s) => s.sources),
            ]

            return (
              <SortableSectionItem
                key={section.id}
                section={section}
                isExpanded={isExpanded}
                allSources={allSources}
                toggleExpanded={toggleExpanded}
                getSourceCounts={getSourceCounts}
                getAggregateStatus={getAggregateStatus}
                onCreateSubsection={onCreateSubsection}
                onEditSection={onEditSection}
                onDeleteSection={onDeleteSection}
                onEditSubsection={onEditSubsection}
                onDeleteSubsection={onDeleteSubsection}
              />
            )
          })}

          <button
            onClick={onCreateSection}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-subtle py-4 text-sm text-text-secondary hover:text-accent-cyan hover:border-accent-cyan/30 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Section
          </button>
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableSectionItem({
  section,
  isExpanded,
  allSources,
  toggleExpanded,
  getSourceCounts,
  getAggregateStatus,
  onCreateSubsection,
  onEditSection,
  onDeleteSection,
  onEditSubsection,
  onDeleteSubsection,
}: {
  section: Section
  isExpanded: boolean
  allSources: Source[]
  toggleExpanded: (id: string) => void
  getSourceCounts: (section: Section) => number
  getAggregateStatus: (sources: Source[]) => string
  onCreateSubsection: (sectionId: string) => void
  onEditSection: (section: Section) => void
  onDeleteSection: (section: Section) => void
  onEditSubsection: (subsection: Subsection) => void
  onDeleteSubsection: (subsection: Subsection) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as any,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-border-subtle bg-surface overflow-hidden"
    >
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-elevated/50 transition-colors group"
        onClick={() => toggleExpanded(section.id)}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-text-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
        <button className="p-0.5">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-secondary" />
          )}
        </button>
        <span className="text-lg">{section.icon || "\u{1F4C1}"}</span>
        <Link
          href={`/sections/${section.id}`}
          className="font-medium text-text-primary hover:text-accent-cyan transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {section.name}
        </Link>
        <span className="text-xs text-text-secondary font-mono">
          {getSourceCounts(section)} sources
        </span>
        <StatusBadge
          status={getAggregateStatus(allSources) as any}
          showLabel={false}
        />
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <EndpointPill endpoint={section.mcpEndpoint} />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCreateSubsection(section.id)
            }}
            className="p-1.5 rounded-md hover:bg-accent-cyan/10 text-text-secondary hover:text-accent-cyan transition-colors"
            title="Add subsection"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEditSection(section)
            }}
            className="p-1.5 rounded-md hover:bg-elevated text-text-secondary hover:text-text-primary transition-colors"
            title="Edit section"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteSection(section)
            }}
            className="p-1.5 rounded-md hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
            title="Delete section"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-subtle">
              {section.sources.map((source) => (
                <Link
                  key={source.id}
                  href={`/sources/${source.id}`}
                  className="flex items-center gap-3 px-4 py-2 pl-16 hover:bg-elevated/30 transition-colors"
                >
                  <StatusBadge status={source.status} showLabel={false} />
                  <span className="text-sm text-text-primary">
                    {source.name}
                  </span>
                  <span className="text-xs text-text-secondary font-mono">
                    {source.chunkCount} chunks
                  </span>
                </Link>
              ))}

              {section.subsections.map((sub) => (
                <SubsectionNode
                  key={sub.id}
                  subsection={sub}
                  onEdit={() => onEditSubsection(sub)}
                  onDelete={() => onDeleteSubsection(sub)}
                />
              ))}

              {section.subsections.length === 0 &&
                section.sources.length === 0 && (
                  <div className="px-4 py-4 pl-16 text-sm text-text-secondary">
                    No subsections or sources yet. Add a subsection to get
                    started.
                  </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SubsectionNode({
  subsection,
  onEdit,
  onDelete,
}: {
  subsection: Subsection
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div
        className="flex items-center gap-3 px-4 py-2 pl-12 cursor-pointer hover:bg-elevated/30 transition-colors group"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="p-0.5">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-text-secondary" />
          )}
        </button>
        <span className="text-sm">{subsection.icon || "\u{1F4C2}"}</span>
        <span className="text-sm font-medium text-text-primary">
          {subsection.name}
        </span>
        <span className="text-xs text-text-secondary font-mono">
          {subsection.sources.length} sources
        </span>
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <EndpointPill endpoint={subsection.mcpEndpoint} />
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1 rounded-md hover:bg-elevated text-text-secondary hover:text-text-primary transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 rounded-md hover:bg-error/10 text-text-secondary hover:text-error transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {subsection.sources.map((source) => (
              <Link
                key={source.id}
                href={`/sources/${source.id}`}
                className="flex items-center gap-3 px-4 py-2 pl-20 hover:bg-elevated/30 transition-colors"
              >
                <StatusBadge status={source.status} showLabel={false} />
                <span className="text-sm text-text-primary">{source.name}</span>
                <span className="text-xs text-text-secondary font-mono">
                  {source.chunkCount} chunks
                </span>
              </Link>
            ))}
            {subsection.sources.length === 0 && (
              <div className="px-4 py-3 pl-20 text-xs text-text-secondary">
                No sources yet.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, Github, FileText, ArrowLeft, ArrowRight, Rocket } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { cn } from "@/lib/utils"

interface AddSourceModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  sections: { id: string; name: string; subsections: { id: string; name: string }[] }[]
}

type SourceType = "URL" | "GITHUB_REPO" | "PDF"

const TYPE_CARDS = [
  {
    type: "URL" as SourceType,
    icon: Globe,
    emoji: "🌐",
    title: "Documentation URL",
    desc: "Any publicly accessible docs website",
    color: "accent-cyan",
  },
  {
    type: "GITHUB_REPO" as SourceType,
    icon: Github,
    emoji: "🐙",
    title: "GitHub Repository",
    desc: "Public repo; indexes README, /docs, .sol files, .md files",
    color: "accent-purple",
  },
  {
    type: "PDF" as SourceType,
    icon: FileText,
    emoji: "📄",
    title: "PDF Upload",
    desc: "Official whitepapers, audit reports, spec documents",
    color: "accent-green",
  },
]

export function AddSourceModal({
  open,
  onClose,
  onSubmit,
  sections,
}: AddSourceModalProps) {
  const [step, setStep] = useState(1)
  const [sourceType, setSourceType] = useState<SourceType | null>(null)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [version, setVersion] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [subsectionId, setSubsectionId] = useState("")
  const [refreshCron, setRefreshCron] = useState("none")
  const [crawlDepth, setCrawlDepth] = useState(1)
  const [branch, setBranch] = useState("main")
  const [indexReadme, setIndexReadme] = useState(true)
  const [indexDocs, setIndexDocs] = useState(true)
  const [indexSol, setIndexSol] = useState(true)
  const [indexMd, setIndexMd] = useState(true)
  const [indexTests, setIndexTests] = useState(false)

  useEffect(() => {
    if (open) {
      setStep(1)
      setSourceType(null)
      setName("")
      setUrl("")
      setVersion("")
      setSectionId("")
      setSubsectionId("")
      setRefreshCron("none")
      setCrawlDepth(1)
      setBranch("main")
    }
  }, [open])

  const selectedSection = sections.find((s) => s.id === sectionId)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit({
        name,
        type: sourceType,
        url: url || undefined,
        version: version || undefined,
        sectionId: sectionId || undefined,
        subsectionId: subsectionId || undefined,
        refreshCron: refreshCron === "none" ? undefined : refreshCron,
        crawlDepth,
        branch: sourceType === "GITHUB_REPO" ? branch : undefined,
        indexOptions:
          sourceType === "GITHUB_REPO"
            ? { indexReadme, indexDocs, indexSol, indexMd, indexTests }
            : undefined,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Documentation Source"
      maxWidth="max-w-2xl"
    >
      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                step >= s
                  ? "bg-accent-cyan text-black"
                  : "bg-elevated text-text-secondary"
              )}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "w-8 h-0.5 rounded",
                  step > s ? "bg-accent-cyan" : "bg-border-subtle"
                )}
              />
            )}
          </div>
        ))}
        <span className="text-xs text-text-secondary ml-2">
          {step === 1
            ? "Source Type"
            : step === 2
              ? "Details"
              : "Review & Confirm"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Source Type */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {TYPE_CARDS.map((card) => (
              <button
                key={card.type}
                onClick={() => {
                  setSourceType(card.type)
                  setStep(2)
                }}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
                  "border-border-subtle hover:border-accent-cyan/30 hover:bg-elevated/50"
                )}
              >
                <span className="text-2xl">{card.emoji}</span>
                <div>
                  <div className="font-medium text-text-primary">
                    {card.title}
                  </div>
                  <div className="text-sm text-text-secondary">{card.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-text-secondary ml-auto" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {sourceType === "URL" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://docs.example.com/"
                    className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Crawl Depth
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCrawlDepth(d)}
                        className={cn(
                          "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                          crawlDepth === d
                            ? "bg-accent-cyan text-black"
                            : "bg-elevated text-text-secondary hover:text-text-primary"
                        )}
                      >
                        {d === 1
                          ? "1 — Single page"
                          : d === 2
                            ? "2 — Follow links once"
                            : "3 — Full site"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {sourceType === "GITHUB_REPO" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Repository URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://github.com/Uniswap/v3-core"
                    className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Branch
                  </label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="main"
                    className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Index Options
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: "readme", label: "README.md", checked: indexReadme, set: setIndexReadme },
                      { key: "docs", label: "/docs folder (.md, .mdx)", checked: indexDocs, set: setIndexDocs },
                      { key: "sol", label: ".sol source files (NatSpec extraction)", checked: indexSol, set: setIndexSol },
                      { key: "md", label: ".md files anywhere in repo", checked: indexMd, set: setIndexMd },
                      { key: "tests", label: "Test files (opt-in)", checked: indexTests, set: setIndexTests },
                    ].map((opt) => (
                      <label key={opt.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={opt.checked}
                          onChange={(e) => opt.set(e.target.checked)}
                          className="rounded border-border-subtle"
                        />
                        <span className="text-sm text-text-primary">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {sourceType === "PDF" && (
              <>
                <div className="rounded-lg border-2 border-dashed border-border-subtle p-8 text-center">
                  <FileText className="h-8 w-8 text-text-secondary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">
                    PDF upload via URL reference
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    PDF URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/whitepaper.pdf"
                    className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  />
                </div>
                <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-xs text-warning">
                  Manual .sol file uploads are not supported. Solidity source files must be added via a GitHub repository source to preserve data integrity.
                </div>
              </>
            )}

            {/* Common fields */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Uniswap V3 Core Docs"
                className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Version (optional)
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v3, 0.8.x"
                  className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Refresh Schedule
                </label>
                <select
                  value={refreshCron}
                  onChange={(e) => setRefreshCron(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Section
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => {
                    setSectionId(e.target.value)
                    setSubsectionId("")
                  }}
                  className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                >
                  <option value="">None</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Subsection
                </label>
                <select
                  value={subsectionId}
                  onChange={(e) => setSubsectionId(e.target.value)}
                  className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                  disabled={!sectionId}
                >
                  <option value="">None</option>
                  {selectedSection?.subsections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!name}
                className="flex items-center gap-1 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-black disabled:opacity-50 transition-all hover:bg-accent-cyan/90"
              >
                Review
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-border-subtle bg-elevated/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Type:</span>
                <span className="text-sm font-medium text-text-primary">
                  {sourceType === "URL"
                    ? "Documentation URL"
                    : sourceType === "GITHUB_REPO"
                      ? "GitHub Repository"
                      : "PDF"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Name:</span>
                <span className="text-sm font-medium text-text-primary">
                  {name}
                </span>
              </div>
              {url && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">URL:</span>
                  <code className="text-xs font-mono text-accent-cyan">
                    {url}
                  </code>
                </div>
              )}
              {version && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Version:</span>
                  <span className="text-sm text-text-primary">{version}</span>
                </div>
              )}
              {sectionId && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">
                    Assignment:
                  </span>
                  <span className="text-sm text-text-primary">
                    {sections.find((s) => s.id === sectionId)?.name}
                    {subsectionId &&
                      ` / ${selectedSection?.subsections.find((s) => s.id === subsectionId)?.name}`}
                  </span>
                </div>
              )}
              {refreshCron !== "none" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Refresh:</span>
                  <span className="text-sm text-text-primary capitalize">
                    {refreshCron}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1 rounded-lg px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-accent-green px-5 py-2 text-sm font-medium text-black disabled:opacity-50 transition-all hover:bg-accent-green/90"
              >
                <Rocket className="h-4 w-4" />
                {loading ? "Adding..." : "Add & Start Indexing"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Globe,
  Github,
  FileText,
  ArrowLeft,
  ArrowRight,
  Rocket,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { cn } from "@/lib/utils"

interface AddSourceModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  sections: {
    id: string
    name: string
    subsections: { id: string; name: string }[]
  }[]
}

type SourceType = "URL" | "GITHUB_REPO" | "PDF"

const TYPE_CARDS = [
  {
    type: "URL" as SourceType,
    icon: Globe,
    emoji: "\u{1F310}",
    title: "Documentation URL",
    desc: "Any publicly accessible docs website (JS-rendered supported)",
    color: "accent-cyan",
  },
  {
    type: "GITHUB_REPO" as SourceType,
    icon: Github,
    emoji: "\u{1F419}",
    title: "GitHub Repository",
    desc: "Public repo; indexes README, /docs, .sol files, .md files",
    color: "accent-purple",
  },
  {
    type: "PDF" as SourceType,
    icon: FileText,
    emoji: "\u{1F4C4}",
    title: "PDF Upload",
    desc: "Official whitepapers, audit reports, spec documents",
    color: "accent-green",
  },
]

type UrlStatus = "idle" | "checking" | "valid" | "invalid"

function autoSuggestName(url: string, type: SourceType): string {
  try {
    if (type === "GITHUB_REPO") {
      const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
      if (match) {
        const repo = match[2].replace(/\.git$/, "").replace(/-/g, " ")
        return repo
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      }
    }
    if (type === "URL") {
      const parsed = new URL(url)
      const host = parsed.hostname.replace(/^(www|docs|doc)\./, "")
      const parts = host.split(".")
      const domain = parts[0]
      const path = parsed.pathname
        .replace(/\/$/, "")
        .split("/")
        .filter(Boolean)
        .slice(0, 2)
        .join(" ")
      const name = path
        ? `${domain.charAt(0).toUpperCase() + domain.slice(1)} ${path.replace(/-/g, " ")}`
        : domain.charAt(0).toUpperCase() + domain.slice(1)
      return name
    }
    if (type === "PDF") {
      const parsed = new URL(url)
      const filename = parsed.pathname.split("/").pop()?.replace(/\.pdf$/i, "") || ""
      return filename
        .replace(/[-_]/g, " ")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    }
  } catch {
    // ignore
  }
  return ""
}

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
  const [nameManuallySet, setNameManuallySet] = useState(false)
  const [url, setUrl] = useState("")
  const [urlStatus, setUrlStatus] = useState<UrlStatus>("idle")
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
  const [includePatterns, setIncludePatterns] = useState("")
  const [excludePatterns, setExcludePatterns] = useState("")

  useEffect(() => {
    if (open) {
      setStep(1)
      setSourceType(null)
      setName("")
      setNameManuallySet(false)
      setUrl("")
      setUrlStatus("idle")
      setVersion("")
      setSectionId("")
      setSubsectionId("")
      setRefreshCron("none")
      setCrawlDepth(1)
      setBranch("main")
      setIncludePatterns("")
      setExcludePatterns("")
    }
  }, [open])

  const validateUrl = useCallback(
    async (urlToCheck: string) => {
      if (!urlToCheck) {
        setUrlStatus("idle")
        return
      }
      try {
        new URL(urlToCheck)
      } catch {
        setUrlStatus("invalid")
        return
      }
      setUrlStatus("checking")
      try {
        const res = await fetch("/api/validate-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlToCheck }),
        })
        const data = await res.json()
        setUrlStatus(data.reachable ? "valid" : "invalid")
      } catch {
        setUrlStatus("invalid")
      }
    },
    []
  )

  useEffect(() => {
    if (!url || !sourceType) return
    const timer = setTimeout(() => {
      validateUrl(url)
      if (!nameManuallySet) {
        const suggested = autoSuggestName(url, sourceType)
        if (suggested) setName(suggested)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [url, sourceType, nameManuallySet, validateUrl])

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
        includePatterns: includePatterns || undefined,
        excludePatterns: excludePatterns || undefined,
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

  const urlStatusIcon =
    urlStatus === "checking" ? (
      <Loader2 className="h-4 w-4 text-text-secondary animate-spin" />
    ) : urlStatus === "valid" ? (
      <CheckCircle className="h-4 w-4 text-accent-green" />
    ) : urlStatus === "invalid" ? (
      <XCircle className="h-4 w-4 text-error" />
    ) : null

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
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://docs.example.com/"
                      className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 pr-9 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                      required
                    />
                    <span className="absolute right-2.5 top-2.5">
                      {urlStatusIcon}
                    </span>
                  </div>
                  {urlStatus === "invalid" && url && (
                    <p className="text-xs text-error mt-1">
                      URL could not be reached. Check the address.
                    </p>
                  )}
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
                          ? "1 \u2014 Single page"
                          : d === 2
                            ? "2 \u2014 Follow links once"
                            : "3 \u2014 Full site"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Include Patterns{" "}
                      <span className="text-text-secondary font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={includePatterns}
                      onChange={(e) => setIncludePatterns(e.target.value)}
                      placeholder="/docs, /api"
                      className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Comma-separated URL path segments to include
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Exclude Patterns{" "}
                      <span className="text-text-secondary font-normal">
                        (optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={excludePatterns}
                      onChange={(e) => setExcludePatterns(e.target.value)}
                      placeholder="/blog, /changelog"
                      className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Comma-separated URL path segments to exclude
                    </p>
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
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://github.com/Uniswap/v3-core"
                      className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 pr-9 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                      required
                    />
                    <span className="absolute right-2.5 top-2.5">
                      {urlStatusIcon}
                    </span>
                  </div>
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
                      {
                        key: "readme",
                        label: "README.md",
                        checked: indexReadme,
                        set: setIndexReadme,
                      },
                      {
                        key: "docs",
                        label: "/docs folder (.md, .mdx)",
                        checked: indexDocs,
                        set: setIndexDocs,
                      },
                      {
                        key: "sol",
                        label:
                          ".sol source files (NatSpec + function-level extraction)",
                        checked: indexSol,
                        set: setIndexSol,
                      },
                      {
                        key: "md",
                        label: ".md files anywhere in repo",
                        checked: indexMd,
                        set: setIndexMd,
                      },
                      {
                        key: "tests",
                        label: "Test files (opt-in)",
                        checked: indexTests,
                        set: setIndexTests,
                      },
                    ].map((opt) => (
                      <label key={opt.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={opt.checked}
                          onChange={(e) => opt.set(e.target.checked)}
                          className="rounded border-border-subtle"
                        />
                        <span className="text-sm text-text-primary">
                          {opt.label}
                        </span>
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
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/whitepaper.pdf"
                      className="w-full rounded-lg border border-border-subtle bg-elevated px-3 py-2 pr-9 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
                    />
                    <span className="absolute right-2.5 top-2.5">
                      {urlStatusIcon}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-xs text-warning">
                  Manual .sol file uploads are not supported. Solidity source
                  files must be added via a GitHub repository source to preserve
                  data integrity.
                </div>
              </>
            )}

            {/* Common fields */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Name
                {!nameManuallySet && name && (
                  <span className="text-xs text-text-secondary ml-2 font-normal">
                    (auto-suggested)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameManuallySet(true)
                }}
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
                  {urlStatusIcon && <span>{urlStatusIcon}</span>}
                </div>
              )}
              {version && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Version:</span>
                  <span className="text-sm text-text-primary">{version}</span>
                </div>
              )}
              {includePatterns && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Include:</span>
                  <code className="text-xs font-mono text-text-primary">
                    {includePatterns}
                  </code>
                </div>
              )}
              {excludePatterns && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Exclude:</span>
                  <code className="text-xs font-mono text-text-primary">
                    {excludePatterns}
                  </code>
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

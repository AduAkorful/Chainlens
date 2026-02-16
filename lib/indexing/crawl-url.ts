import * as cheerio from "cheerio"
import type { RawContent } from "./chunk"

interface CrawlUrlOptions {
  url: string
  depth: number
  includePatterns?: string[]
  excludePatterns?: string[]
}

const CONTENT_SELECTORS = [
  "main",
  "article",
  ".content",
  ".docs-content",
  ".prose",
  ".markdown-body",
  '[role="main"]',
  "#content",
  ".documentation",
]

const REMOVE_SELECTORS = [
  "nav",
  "footer",
  "header",
  ".sidebar",
  ".toc",
  ".table-of-contents",
  ".breadcrumb",
  ".pagination",
  ".cookie-banner",
  ".edit-on-github",
  ".social-share",
  "script",
  "style",
  "noscript",
  "iframe",
]

function shouldIncludeUrl(
  url: string,
  baseUrl: string,
  include?: string[],
  exclude?: string[]
): boolean {
  try {
    const parsed = new URL(url)
    const base = new URL(baseUrl)

    if (parsed.hostname !== base.hostname) return false

    if (exclude?.some((p) => parsed.pathname.includes(p))) return false
    if (include?.length && !include.some((p) => parsed.pathname.includes(p)))
      return false

    return true
  } catch {
    return false
  }
}

function extractContent(html: string, pageUrl: string): RawContent[] {
  const $ = cheerio.load(html)

  REMOVE_SELECTORS.forEach((sel) => $(sel).remove())

  let $content: cheerio.Cheerio<any> | null = null
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first()
    if (el.length) {
      $content = el
      break
    }
  }

  if (!$content) {
    $content = $("body")
  }

  const results: RawContent[] = []
  const headings = $content.find("h1, h2, h3, h4")

  if (headings.length === 0) {
    const text = $content.text().trim()
    if (text) {
      results.push({
        content: text,
        heading: $("title").text().trim() || undefined,
        url: pageUrl,
      })
    }
    return results
  }

  const headingBreadcrumbs: string[] = []
  const headingLevels: number[] = []

  headings.each((_, el) => {
    const $el = $(el)
    const level = parseInt(el.tagName.replace("h", ""), 10)
    const text = $el.text().trim()

    while (
      headingLevels.length > 0 &&
      headingLevels[headingLevels.length - 1] >= level
    ) {
      headingBreadcrumbs.pop()
      headingLevels.pop()
    }

    headingBreadcrumbs.push(text)
    headingLevels.push(level)

    let sectionContent = ""
    let next = $el.next()
    while (next.length && !next.is("h1, h2, h3, h4")) {
      if (next.is("pre, code")) {
        sectionContent += "\n```\n" + next.text() + "\n```\n"
      } else {
        sectionContent += "\n" + next.text()
      }
      next = next.next()
    }

    if (sectionContent.trim()) {
      results.push({
        content: sectionContent.trim(),
        heading: headingBreadcrumbs.join(" > "),
        url: pageUrl,
      })
    }
  })

  return results
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "ChainLens/0.8 Documentation Indexer (personal developer tool)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) return null
    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("text/html")) return null

    return await response.text()
  } catch {
    return null
  }
}

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html)
  const links: string[] = []

  $("a[href]").each((_, el) => {
    try {
      const href = $(el).attr("href")
      if (!href) return
      const absolute = new URL(href, baseUrl).toString()
      const clean = absolute.split("#")[0].split("?")[0]
      if (!links.includes(clean)) links.push(clean)
    } catch {
      // skip invalid URLs
    }
  })

  return links
}

export async function crawlUrl(options: CrawlUrlOptions): Promise<RawContent[]> {
  const { url, depth, includePatterns, excludePatterns } = options
  const visited = new Set<string>()
  const allContent: RawContent[] = []

  async function crawlPage(pageUrl: string, currentDepth: number) {
    const normalized = pageUrl.split("#")[0].split("?")[0]
    if (visited.has(normalized)) return
    visited.add(normalized)

    const html = await fetchPage(pageUrl)
    if (!html) return

    const content = extractContent(html, pageUrl)
    allContent.push(...content)

    if (currentDepth < depth) {
      const links = extractLinks(html, pageUrl)
      const filteredLinks = links.filter((l) =>
        shouldIncludeUrl(l, url, includePatterns, excludePatterns)
      )

      for (const link of filteredLinks.slice(0, 50)) {
        await crawlPage(link, currentDepth + 1)
        await new Promise((r) => setTimeout(r, 500))
      }
    }
  }

  await crawlPage(url, 1)
  return allContent
}

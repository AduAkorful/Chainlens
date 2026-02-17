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
  "#main-content",
  ".page-content",
  ".doc-content",
  ".rst-content",
  ".md-content",
  '[data-content]',
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
  ".nav-links",
  ".edit-page-link",
  ".github-edit-link",
  ".page-edit",
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

function extractContentFromHtml(html: string, pageUrl: string): RawContent[] {
  const $ = cheerio.load(html)
  REMOVE_SELECTORS.forEach((sel) => $(sel).remove())

  let $content: cheerio.Cheerio<any> | null = null
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first()
    if (el.length && el.text().trim().length > 50) {
      $content = el
      break
    }
  }
  if (!$content) $content = $("body")

  const results: RawContent[] = []
  const headings = $content.find("h1, h2, h3, h4")

  if (headings.length === 0) {
    const text = $content.text().trim()
    if (text && text.length > 20) {
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

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html)
  const links: string[] = []
  $("a[href]").each((_, el) => {
    try {
      const href = $(el).attr("href")
      if (!href) return
      if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) return
      const absolute = new URL(href, baseUrl).toString()
      const clean = absolute.split("#")[0].split("?")[0]
      if (!links.includes(clean)) links.push(clean)
    } catch {
      // skip
    }
  })
  return links
}

const IS_VERCEL = !!process.env.VERCEL

async function renderWithPlaywright(url: string): Promise<string | null> {
  if (IS_VERCEL) {
    console.log(`[CrawlUrl] Playwright unavailable on Vercel, using fetch for ${url}`)
    return null
  }
  try {
    const { chromium } = await import("playwright")
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    try {
      const page = await browser.newPage()
      page.setDefaultTimeout(30000)
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(2000)
      const html = await page.content()
      return html
    } finally {
      await browser.close()
    }
  } catch (err) {
    console.warn(`Playwright render failed for ${url}, falling back to fetch:`, err)
    return null
  }
}

async function fetchPage(url: string, usePlaywright: boolean): Promise<string | null> {
  if (usePlaywright) {
    const html = await renderWithPlaywright(url)
    if (html) return html
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ChainLens/0.8 Documentation Indexer (personal developer tool)",
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

async function detectJsRendered(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "ChainLens/0.8 Documentation Indexer (personal developer tool)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) return true
    const html = await response.text()
    const $ = cheerio.load(html)

    let contentLen = 0
    for (const selector of CONTENT_SELECTORS) {
      const el = $(selector).first()
      if (el.length) {
        contentLen = el.text().trim().length
        break
      }
    }
    if (contentLen === 0) contentLen = $("body").text().trim().length

    const hasAppRoot = $('[id="app"], [id="root"], [id="__next"], [id="__nuxt"]').length > 0
    const hasNoscript = $("noscript").text().toLowerCase().includes("javascript")
    const scriptCount = $("script[src]").length

    if (contentLen < 200 && (hasAppRoot || hasNoscript || scriptCount > 5)) {
      return true
    }
    return false
  } catch {
    return true
  }
}

export async function crawlUrl(options: CrawlUrlOptions): Promise<RawContent[]> {
  const { url, depth, includePatterns, excludePatterns } = options
  const visited = new Set<string>()
  const allContent: RawContent[] = []

  const needsPlaywright = await detectJsRendered(url)
  console.log(`[CrawlUrl] ${url} - JS rendered: ${needsPlaywright}, depth: ${depth}`)

  async function crawlPage(pageUrl: string, currentDepth: number) {
    const normalized = pageUrl.split("#")[0].split("?")[0]
    if (visited.has(normalized)) return
    visited.add(normalized)

    const html = await fetchPage(pageUrl, needsPlaywright)
    if (!html) return

    const content = extractContentFromHtml(html, pageUrl)
    allContent.push(...content)

    if (currentDepth < depth) {
      const links = extractLinks(html, pageUrl)
      const filteredLinks = links.filter((l) =>
        shouldIncludeUrl(l, url, includePatterns, excludePatterns)
      )

      for (const link of filteredLinks.slice(0, 50)) {
        await crawlPage(link, currentDepth + 1)
        await new Promise((r) => setTimeout(r, needsPlaywright ? 1500 : 500))
      }
    }
  }

  await crawlPage(url, 0)
  return allContent
}

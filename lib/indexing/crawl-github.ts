import { Octokit } from "@octokit/rest"
import type { RawContent } from "./chunk"

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined,
})

interface CrawlGithubOptions {
  url: string
  branch: string
  indexOptions?: {
    indexReadme?: boolean
    indexDocs?: boolean
    indexSol?: boolean
    indexMd?: boolean
    indexTests?: boolean
  }
}

function parseGithubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`)
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") }
}

function shouldIndexFile(
  path: string,
  options: CrawlGithubOptions["indexOptions"]
): boolean {
  const opts = options || {}
  const lower = path.toLowerCase()

  if (lower === "readme.md" && opts.indexReadme !== false) return true
  if (lower.startsWith("docs/") && opts.indexDocs !== false) {
    if (lower.endsWith(".md") || lower.endsWith(".mdx")) return true
  }
  if (lower.endsWith(".sol") && opts.indexSol !== false) return true
  if (
    (lower.endsWith(".md") || lower.endsWith(".mdx")) &&
    opts.indexMd !== false
  )
    return true
  if (
    opts.indexTests &&
    (lower.includes("/test/") || lower.includes("/tests/"))
  )
    return true

  return false
}

function isPragma08OrAbove(content: string): boolean {
  const pragmaMatch = content.match(/pragma\s+solidity\s+([^;]+);/)
  if (!pragmaMatch) return true

  const version = pragmaMatch[1].trim()
  if (version.includes("0.8") || version.includes(">=0.8") || version.includes("^0.8")) {
    return true
  }

  const versionNum = version.match(/(\d+)\.(\d+)/)
  if (versionNum) {
    const minor = parseInt(versionNum[2], 10)
    if (minor < 8) return false
  }

  return true
}

interface NatSpecTags {
  title?: string
  author?: string
  notice?: string
  dev?: string
  params: { name: string; desc: string }[]
  returns: { name: string; desc: string }[]
}

function parseNatSpec(comment: string): NatSpecTags {
  const tags: NatSpecTags = { params: [], returns: [] }
  const lines = comment
    .replace(/^\/\*\*/, "")
    .replace(/\*\/$/, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter(Boolean)

  for (const line of lines) {
    const tagMatch = line.match(/^@(\w+)\s+(.*)/)
    if (!tagMatch) continue
    const [, tag, value] = tagMatch
    switch (tag) {
      case "title":
        tags.title = value
        break
      case "author":
        tags.author = value
        break
      case "notice":
        tags.notice = value
        break
      case "dev":
        tags.dev = value
        break
      case "param": {
        const pm = value.match(/^(\w+)\s+(.*)/)
        if (pm) tags.params.push({ name: pm[1], desc: pm[2] })
        break
      }
      case "return": {
        const rm = value.match(/^(\w+)\s+(.*)/)
        if (rm) tags.returns.push({ name: rm[1], desc: rm[2] })
        else tags.returns.push({ name: "", desc: value })
        break
      }
    }
  }
  return tags
}

interface FuncMeta {
  name: string
  visibility: string
  mutability: string
  modifiers: string[]
  signature: string
  natspec: NatSpecTags | null
  body: string
}

function extractSolidityFunctions(content: string): FuncMeta[] {
  const results: FuncMeta[] = []

  const funcPattern =
    /(\/\*\*[\s\S]*?\*\/\s*)?(?:\/\/[^\n]*\n\s*)*(function\s+(\w+)\s*\(([^)]*)\)\s*([^{]*)\{)/g
  let match

  while ((match = funcPattern.exec(content)) !== null) {
    const [, natspecBlock, fullSig, funcName, , modLine] = match

    const visibility =
      (modLine.match(/\b(public|external|internal|private)\b/)?.[1]) || "public"
    const mutability =
      (modLine.match(/\b(view|pure|payable)\b/)?.[1]) || ""
    const modifiers = Array.from(
      modLine.matchAll(/\b(?!public|external|internal|private|view|pure|payable|returns|virtual|override)\b(\w+)/g)
    )
      .map((m) => m[1])
      .filter((m) => m.length > 1 && m !== "function")

    const natspec = natspecBlock ? parseNatSpec(natspecBlock) : null

    const startIdx = match.index! + match[0].length
    let braceCount = 1
    let endIdx = startIdx
    while (braceCount > 0 && endIdx < content.length) {
      if (content[endIdx] === "{") braceCount++
      if (content[endIdx] === "}") braceCount--
      endIdx++
    }

    const body = content.slice(match.index!, endIdx)

    results.push({
      name: funcName,
      visibility,
      mutability,
      modifiers,
      signature: fullSig.trim(),
      natspec,
      body,
    })
  }

  return results
}

function extractSolidityContent(content: string, filePath: string): RawContent[] {
  if (!isPragma08OrAbove(content)) return []

  const results: RawContent[] = []

  const spdx = content.match(/\/\/\s*SPDX-License-Identifier:\s*(.+)/)?.[1]?.trim()
  const pragma = content.match(/pragma\s+solidity\s+([^;]+);/)?.[1]?.trim()
  const contractMatch = content.match(
    /(?:contract|interface|library|abstract\s+contract)\s+(\w+)/
  )
  const contractName = contractMatch?.[1] || filePath.split("/").pop()?.replace(".sol", "")

  const funcs = extractSolidityFunctions(content)

  for (const func of funcs) {
    let chunkText = ""

    if (func.natspec) {
      const ns = func.natspec
      const parts: string[] = []
      if (ns.title) parts.push(`@title ${ns.title}`)
      if (ns.author) parts.push(`@author ${ns.author}`)
      if (ns.notice) parts.push(`@notice ${ns.notice}`)
      if (ns.dev) parts.push(`@dev ${ns.dev}`)
      for (const p of ns.params) parts.push(`@param ${p.name} ${p.desc}`)
      for (const r of ns.returns) parts.push(`@return ${r.name} ${r.desc}`.trim())
      if (parts.length) chunkText += "/// " + parts.join("\n/// ") + "\n"
    }

    chunkText += `// ${func.visibility}${func.mutability ? " " + func.mutability : ""}${func.modifiers.length ? " [" + func.modifiers.join(", ") + "]" : ""}\n`
    chunkText += func.body

    results.push({
      content: chunkText,
      heading: `${contractName} > ${func.name}`,
      filePath,
    })
  }

  const eventRegex = /(\/\*\*[\s\S]*?\*\/\s*)?event\s+(\w+)\s*\([^)]*\)\s*;/g
  let eventMatch
  while ((eventMatch = eventRegex.exec(content)) !== null) {
    const natspec = eventMatch[1] ? parseNatSpec(eventMatch[1]) : null
    let text = ""
    if (natspec?.notice) text += `/// @notice ${natspec.notice}\n`
    text += eventMatch[0].replace(eventMatch[1] || "", "").trim()
    results.push({
      content: text,
      heading: `${contractName} > event ${eventMatch[2]}`,
      filePath,
    })
  }

  const errorRegex = /(\/\*\*[\s\S]*?\*\/\s*)?error\s+(\w+)\s*\([^)]*\)\s*;/g
  let errorMatch
  while ((errorMatch = errorRegex.exec(content)) !== null) {
    const natspec = errorMatch[1] ? parseNatSpec(errorMatch[1]) : null
    let text = ""
    if (natspec?.notice) text += `/// @notice ${natspec.notice}\n`
    text += errorMatch[0].replace(errorMatch[1] || "", "").trim()
    results.push({
      content: text,
      heading: `${contractName} > error ${errorMatch[2]}`,
      filePath,
    })
  }

  if (results.length === 0) {
    const header = [
      spdx && `// SPDX: ${spdx}`,
      pragma && `// pragma: ${pragma}`,
      contractName && `// Contract: ${contractName}`,
    ]
      .filter(Boolean)
      .join("\n")
    results.push({
      content: header + "\n\n" + content.slice(0, 2000),
      heading: contractName || undefined,
      filePath,
    })
  }

  return results
}

function extractMarkdownContent(
  content: string,
  filePath: string
): RawContent[] {
  const results: RawContent[] = []
  const lines = content.split("\n")
  let currentHeading = filePath
  let currentContent = ""

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/)
    if (headingMatch) {
      if (currentContent.trim()) {
        results.push({
          content: currentContent.trim(),
          heading: currentHeading,
          filePath,
        })
      }
      currentHeading = headingMatch[2].trim()
      currentContent = ""
    } else {
      currentContent += line + "\n"
    }
  }

  if (currentContent.trim()) {
    results.push({
      content: currentContent.trim(),
      heading: currentHeading,
      filePath,
    })
  }

  return results
}

export async function crawlGithub(
  options: CrawlGithubOptions
): Promise<RawContent[]> {
  const { owner, repo } = parseGithubUrl(options.url)
  const allContent: RawContent[] = []

  try {
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: options.branch,
      recursive: "true",
    })

    const files = tree.tree.filter(
      (item) =>
        item.type === "blob" &&
        item.path &&
        shouldIndexFile(item.path, options.indexOptions)
    )

    for (const file of files.slice(0, 200)) {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path!,
          ref: options.branch,
        })

        if ("content" in data && data.content) {
          const content = Buffer.from(data.content, "base64").toString("utf-8")
          const filePath = file.path!

          if (filePath.endsWith(".sol")) {
            allContent.push(...extractSolidityContent(content, filePath))
          } else if (
            filePath.endsWith(".md") ||
            filePath.endsWith(".mdx")
          ) {
            allContent.push(...extractMarkdownContent(content, filePath))
          }
        }

        await new Promise((r) => setTimeout(r, 100))
      } catch {
        // skip files that can't be fetched
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to crawl GitHub repo ${owner}/${repo}: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }

  return allContent
}

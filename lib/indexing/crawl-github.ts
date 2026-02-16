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

function extractSolidityContent(content: string, filePath: string): RawContent[] {
  if (!isPragma08OrAbove(content)) return []

  const results: RawContent[] = []

  const spdx = content.match(/\/\/\s*SPDX-License-Identifier:\s*(.+)/)?.[1]?.trim()
  const pragma = content.match(/pragma\s+solidity\s+([^;]+);/)?.[1]?.trim()

  const contractMatch = content.match(
    /(?:contract|interface|library|abstract\s+contract)\s+(\w+)/
  )
  const contractName = contractMatch?.[1] || filePath.split("/").pop()?.replace(".sol", "")

  const natspecRegex =
    /\/\*\*[\s\S]*?\*\/\s*(?:function|event|error|(?:contract|interface|library|abstract\s+contract))\s+\w+[^{]*/g
  const matches = content.match(natspecRegex)

  if (matches) {
    for (const match of matches) {
      results.push({
        content: match.trim(),
        heading: contractName || undefined,
        filePath,
      })
    }
  }

  const funcRegex =
    /(?:\/\/[^\n]*\n\s*)?function\s+\w+\s*\([^)]*\)[^{]*\{/g
  const funcMatches = content.match(funcRegex)

  if (funcMatches) {
    for (const match of funcMatches) {
      if (!results.some((r) => r.content.includes(match.trim()))) {
        results.push({
          content: match.trim(),
          heading: contractName || undefined,
          filePath,
        })
      }
    }
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

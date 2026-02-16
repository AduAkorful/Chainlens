import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

interface SeedSection {
  name: string
  icon: string
  subsections: {
    name: string
    icon: string
    slug: string
  }[]
}

interface SeedSource {
  name: string
  type: "URL" | "GITHUB_REPO" | "PDF"
  url: string
  version?: string
  subsection: string
}

const SECTIONS: SeedSection[] = [
  {
    name: "Smart Contract Languages",
    icon: "🧱",
    subsections: [
      { name: "Solidity 0.8+", icon: "📝", slug: "solidity-0-8" },
      { name: "Yul & Assembly", icon: "⚙️", slug: "yul-assembly" },
    ],
  },
  {
    name: "Development Frameworks",
    icon: "🛠",
    subsections: [
      { name: "Foundry", icon: "🔨", slug: "foundry" },
      { name: "Hardhat", icon: "👷", slug: "hardhat" },
      { name: "OpenZeppelin Contracts", icon: "🛡", slug: "openzeppelin" },
    ],
  },
  {
    name: "DeFi Protocols",
    icon: "💱",
    subsections: [
      { name: "Uniswap V3", icon: "🦄", slug: "uniswap-v3" },
      { name: "Uniswap V2", icon: "🦄", slug: "uniswap-v2" },
      { name: "Aave V3", icon: "👻", slug: "aave-v3" },
      { name: "Aave V2", icon: "👻", slug: "aave-v2" },
      { name: "SushiSwap MasterChef V1", icon: "🍣", slug: "masterchef-v1" },
      { name: "SushiSwap MasterChef V2", icon: "🍣", slug: "masterchef-v2" },
      { name: "Chainlink Price Feeds", icon: "🔗", slug: "chainlink-price-feeds" },
      { name: "Chainlink VRF", icon: "🎲", slug: "chainlink-vrf" },
      { name: "Chainlink Automation", icon: "⚡", slug: "chainlink-automation" },
    ],
  },
  {
    name: "Ethereum Standards & EIPs",
    icon: "📋",
    subsections: [
      { name: "Core EIPs", icon: "📜", slug: "core-eips" },
    ],
  },
  {
    name: "Security & Auditing",
    icon: "🔐",
    subsections: [
      { name: "Known Vulnerabilities", icon: "⚠️", slug: "known-vulnerabilities" },
      { name: "Audit Tools", icon: "🔍", slug: "audit-tools" },
      { name: "Common Attack Patterns", icon: "🎯", slug: "common-attack-patterns" },
    ],
  },
  {
    name: "Gas Optimisation",
    icon: "⚡",
    subsections: [
      { name: "Solidity Patterns", icon: "🧩", slug: "solidity-patterns" },
      { name: "Storage Packing", icon: "📦", slug: "storage-packing" },
      { name: "Assembly & Opcodes", icon: "💻", slug: "assembly-opcodes" },
    ],
  },
  {
    name: "Testing & Verification",
    icon: "🧪",
    subsections: [
      { name: "Foundry Testing", icon: "🧪", slug: "foundry-testing" },
      { name: "Formal Verification", icon: "✅", slug: "formal-verification" },
    ],
  },
  {
    name: "Tooling & Infrastructure",
    icon: "🔌",
    subsections: [
      { name: "Ethers.js", icon: "📡", slug: "ethers-js" },
      { name: "Viem & Wagmi", icon: "🔷", slug: "viem-wagmi" },
      { name: "The Graph", icon: "📊", slug: "the-graph" },
    ],
  },
]

const SOURCES: SeedSource[] = [
  { name: "Solidity 0.8.x Documentation", type: "URL", url: "https://docs.soliditylang.org/en/v0.8.28/", version: "0.8.x", subsection: "solidity-0-8" },
  { name: "Solidity GitHub Repo (0.8 branch)", type: "GITHUB_REPO", url: "https://github.com/ethereum/solidity", version: "0.8.x", subsection: "solidity-0-8" },
  { name: "OpenZeppelin Contracts v5 Docs", type: "URL", url: "https://docs.openzeppelin.com/contracts/5.x/", version: "v5", subsection: "openzeppelin" },
  { name: "OpenZeppelin Contracts v5 Repo", type: "GITHUB_REPO", url: "https://github.com/OpenZeppelin/openzeppelin-contracts", version: "v5", subsection: "openzeppelin" },
  { name: "Uniswap V3 Docs", type: "URL", url: "https://docs.uniswap.org/contracts/v3/overview", version: "v3", subsection: "uniswap-v3" },
  { name: "Uniswap V3 Core Repo", type: "GITHUB_REPO", url: "https://github.com/Uniswap/v3-core", version: "v3", subsection: "uniswap-v3" },
  { name: "Uniswap V3 Periphery Repo", type: "GITHUB_REPO", url: "https://github.com/Uniswap/v3-periphery", version: "v3", subsection: "uniswap-v3" },
  { name: "Uniswap V2 Docs", type: "URL", url: "https://docs.uniswap.org/contracts/v2/overview", version: "v2", subsection: "uniswap-v2" },
  { name: "Uniswap V2 Core Repo", type: "GITHUB_REPO", url: "https://github.com/Uniswap/v2-core", version: "v2", subsection: "uniswap-v2" },
  { name: "Aave V3 Developer Docs", type: "URL", url: "https://docs.aave.com/developers/getting-started/readme", version: "v3", subsection: "aave-v3" },
  { name: "Aave V3 Core Repo", type: "GITHUB_REPO", url: "https://github.com/aave/aave-v3-core", version: "v3", subsection: "aave-v3" },
  { name: "Aave V2 Developer Docs", type: "URL", url: "https://docs.aave.com/developers/v/2.0/", version: "v2", subsection: "aave-v2" },
  { name: "SushiSwap MasterChef V1 Repo", type: "GITHUB_REPO", url: "https://github.com/sushiswap/sushiswap", version: "v1", subsection: "masterchef-v1" },
  { name: "SushiSwap MasterChef V2 Repo", type: "GITHUB_REPO", url: "https://github.com/sushiswap/sushiswap", version: "v2", subsection: "masterchef-v2" },
  { name: "Chainlink Developer Docs", type: "URL", url: "https://docs.chain.link/", subsection: "chainlink-price-feeds" },
  { name: "Chainlink Contracts Repo", type: "GITHUB_REPO", url: "https://github.com/smartcontractkit/chainlink", subsection: "chainlink-price-feeds" },
  { name: "Foundry Book", type: "URL", url: "https://book.getfoundry.sh/", subsection: "foundry" },
  { name: "Foundry Repo", type: "GITHUB_REPO", url: "https://github.com/foundry-rs/foundry", subsection: "foundry" },
  { name: "Ethereum EIPs Repository", type: "GITHUB_REPO", url: "https://github.com/ethereum/EIPs", subsection: "core-eips" },
  { name: "EIPs Website", type: "URL", url: "https://eips.ethereum.org/", subsection: "core-eips" },
  { name: "SWC Registry", type: "URL", url: "https://swcregistry.io/", subsection: "known-vulnerabilities" },
  { name: "SCSVS — Smart Contract Security Verification Standard", type: "GITHUB_REPO", url: "https://github.com/securing/SCSVS", subsection: "known-vulnerabilities" },
  { name: "not-so-smart-contracts (Trail of Bits)", type: "GITHUB_REPO", url: "https://github.com/crytic/not-so-smart-contracts", subsection: "known-vulnerabilities" },
  { name: "EVM Codes — Opcode Reference", type: "URL", url: "https://www.evm.codes/", subsection: "assembly-opcodes" },
  { name: "Gas Optimisation Patterns Repo", type: "GITHUB_REPO", url: "https://github.com/ZeroEkkusu/re-golf-course", subsection: "solidity-patterns" },
  { name: "Ethers.js v6 Docs", type: "URL", url: "https://docs.ethers.org/v6/", subsection: "ethers-js" },
  { name: "Viem Docs", type: "URL", url: "https://viem.sh/", subsection: "viem-wagmi" },
  { name: "The Graph Docs", type: "URL", url: "https://thegraph.com/docs/", subsection: "the-graph" },
]

async function seed() {
  console.log("🌱 Seeding ChainLens database...")

  const subsectionMap = new Map<string, string>()

  for (let i = 0; i < SECTIONS.length; i++) {
    const sec = SECTIONS[i]
    const sectionSlug = generateSlug(sec.name)
    const sectionEndpoint = `sec-${sectionSlug}`

    console.log(`  📁 Section: ${sec.name}`)

    const section = await prisma.section.upsert({
      where: { slug: sectionSlug },
      update: { name: sec.name, icon: sec.icon, order: i },
      create: {
        name: sec.name,
        slug: sectionSlug,
        icon: sec.icon,
        order: i,
        mcpEndpoint: sectionEndpoint,
      },
    })

    for (let j = 0; j < sec.subsections.length; j++) {
      const sub = sec.subsections[j]
      const subEndpoint = `sub-${sectionSlug}-${sub.slug}`

      const subsection = await prisma.subsection.upsert({
        where: {
          sectionId_slug: { sectionId: section.id, slug: sub.slug },
        },
        update: { name: sub.name, icon: sub.icon, order: j },
        create: {
          name: sub.name,
          slug: sub.slug,
          icon: sub.icon,
          order: j,
          sectionId: section.id,
          mcpEndpoint: subEndpoint,
        },
      })

      subsectionMap.set(sub.slug, subsection.id)
      console.log(`    📂 Subsection: ${sub.name}`)
    }
  }

  for (const src of SOURCES) {
    const subsectionId = subsectionMap.get(src.subsection)
    if (!subsectionId) {
      console.warn(`    ⚠️ Subsection not found: ${src.subsection}`)
      continue
    }

    const sourceSlug = generateSlug(src.name)
    const sourceEndpoint = `src-${sourceSlug}`

    const existingSource = await prisma.docSource.findUnique({
      where: { mcpEndpoint: sourceEndpoint },
    })

    if (existingSource) {
      console.log(`    ⏭️ Source exists: ${src.name}`)
      continue
    }

    await prisma.docSource.create({
      data: {
        name: src.name,
        type: src.type,
        url: src.url,
        version: src.version || null,
        subsectionId,
        mcpEndpoint: sourceEndpoint,
        status: "PENDING",
      },
    })

    console.log(`    📄 Source: ${src.name}`)
  }

  console.log("\n✅ Seed complete!")
  console.log(
    `   ${SECTIONS.length} sections, ${SECTIONS.reduce((a, s) => a + s.subsections.length, 0)} subsections, ${SOURCES.length} sources`
  )
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function sectionEndpoint(slug: string): string {
  return `sec-${slug}`
}

export function subsectionEndpoint(sectionSlug: string, subsectionSlug: string): string {
  return `sub-${sectionSlug}-${subsectionSlug}`
}

export function sourceEndpoint(slug: string): string {
  return `src-${slug}`
}

export function generateSourceSlug(name: string): string {
  const base = generateSlug(name)
  const suffix = Date.now().toString(36).slice(-4)
  return `${base}-${suffix}`
}

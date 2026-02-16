import { inngest } from "../client"
import { prisma } from "@/lib/db"

const INTERVALS: Record<string, number> = {
  daily: 86400,
  weekly: 604800,
  monthly: 2592000,
}

export const refreshSources = inngest.createFunction(
  { id: "refresh-doc-sources", name: "Scheduled Doc Refresh" },
  { cron: "0 2 * * *" },
  async ({ step }) => {
    const now = new Date()

    const dueSources = await step.run("find-due-sources", async () => {
      const all = await prisma.docSource.findMany({
        where: {
          refreshCron: { not: null },
          status: "READY",
        },
      })

      return all.filter((source) => {
        if (!source.refreshCron || source.refreshCron === "none") return false
        if (!source.lastIndexedAt) return true

        const intervalSecs = INTERVALS[source.refreshCron] ?? Infinity
        const elapsed =
          (now.getTime() - source.lastIndexedAt.getTime()) / 1000
        return elapsed >= intervalSecs
      })
    })

    for (const source of dueSources) {
      await step.run(`refresh-${source.id}`, async () => {
        await prisma.docSource.update({
          where: { id: source.id },
          data: { status: "REFRESHING" },
        })

        await inngest.send({
          name: "source/index.requested",
          data: { sourceId: source.id },
        })
      })
    }

    return { refreshed: dueSources.length }
  }
)

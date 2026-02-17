import { serve } from "inngest/next"
import { inngest } from "@/lib/inngest/client"
import { indexSource } from "@/lib/inngest/functions/index-source"
import { refreshSources } from "@/lib/inngest/functions/refresh-sources"

export const maxDuration = 60

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [indexSource, refreshSources],
})

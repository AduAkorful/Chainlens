import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "chainlens",
  eventKey: process.env.INNGEST_EVENT_KEY,
})

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || typeof url !== "string") {
      return NextResponse.json({ reachable: false }, { status: 400 })
    }

    try {
      new URL(url)
    } catch {
      return NextResponse.json({ reachable: false })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "ChainLens/0.8 URL Validator",
        },
      })
      clearTimeout(timeout)
      return NextResponse.json({
        reachable: res.ok || res.status === 405 || res.status === 301 || res.status === 302,
        status: res.status,
      })
    } catch {
      clearTimeout(timeout)
      try {
        const res = await fetch(url, {
          method: "GET",
          signal: AbortSignal.timeout(8000),
          headers: {
            "User-Agent": "ChainLens/0.8 URL Validator",
            Range: "bytes=0-0",
          },
        })
        return NextResponse.json({
          reachable: res.ok || res.status === 206,
          status: res.status,
        })
      } catch {
        return NextResponse.json({ reachable: false })
      }
    }
  } catch {
    return NextResponse.json({ reachable: false }, { status: 500 })
  }
}

"use client"

import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"

export function useRealtimeSource() {
  const queryClient = useQueryClient()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["sources"] })
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [queryClient])
}

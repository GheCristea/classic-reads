"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export function BackButton() {
  const router = useRouter()

  const handleClick = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/books")
    }
  }, [router])

  return (
    <Button variant="ghost" onClick={handleClick}>
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back to Books
    </Button>
  )
}



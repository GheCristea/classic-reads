"use client"

import { getCurrentLanguage } from "@/lib/language"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export function LanguageSync() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const langParam = searchParams.get("lang")
    const currentLang = getCurrentLanguage()
    
    // If we have a language preference but no URL param, add it
    if (!langParam && currentLang !== "en") {
      const url = new URL(window.location.href)
      url.searchParams.set("lang", currentLang)
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  return null
}

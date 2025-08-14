import { useSearchParams } from "next/navigation"

export const languages = [
  { code: "en", name: "English", emoji: "🇬🇧" },
  { code: "fr", name: "French", emoji: "🇫🇷" },
  { code: "de", name: "German", emoji: "🇩🇪" },
  { code: "es", name: "Spanish", emoji: "🇪🇸" },
  { code: "it", name: "Italian", emoji: "🇮🇹" },
  { code: "pt", name: "Portuguese", emoji: "🇵🇹" },
  { code: "ru", name: "Russian", emoji: "🇷🇺" },
  { code: "zh", name: "Chinese", emoji: "🇨🇳" },
]

export function getCurrentLanguage(): string {
  if (typeof window === "undefined") return "en"
  
  // First check URL params
  const params = new URLSearchParams(window.location.search)
  const langParam = params.get("lang")
  
  if (langParam && languages.some(lang => lang.code === langParam)) {
    // Save to localStorage for persistence
    localStorage.setItem('preferred-language', langParam)
    return langParam
  }
  
  // Fall back to localStorage
  const savedLanguage = localStorage.getItem('preferred-language')
  if (savedLanguage && languages.some(lang => lang.code === savedLanguage)) {
    return savedLanguage
  }
  
  return "en"
}

export function getLanguageInfo(code: string) {
  return languages.find(lang => lang.code === code)
}

export function setLanguageInUrl(languageCode: string) {
  if (typeof window === "undefined") return
  
  if (!languages.some(lang => lang.code === languageCode)) {
    console.warn(`Invalid language code: ${languageCode}`)
    return
  }
  
  // Save to localStorage
  localStorage.setItem('preferred-language', languageCode)
  
  // Update current URL
  const url = new URL(window.location.href)
  if (languageCode === "en") {
    url.searchParams.delete("lang")
  } else {
    url.searchParams.set("lang", languageCode)
  }
  
  window.history.replaceState({}, "", url.toString())
}

// Hook for components that need current language
export function useCurrentLanguage() {
  const searchParams = useSearchParams()
  const langParam = searchParams.get("lang")
  
  // Check URL first
  if (langParam && languages.some(lang => lang.code === langParam)) {
    return langParam
  }
  
  // Fall back to localStorage on client side
  if (typeof window !== "undefined") {
    const savedLanguage = localStorage.getItem('preferred-language')
    if (savedLanguage && languages.some(lang => lang.code === savedLanguage)) {
      return savedLanguage
    }
  }
  
  return "en"
}

// Utility to add language parameter to URLs for navigation
export function addLanguageToUrl(url: string): string {
  if (typeof window === "undefined") return url
  
  const currentLang = getCurrentLanguage()
  if (currentLang === "en") return url
  
  const urlObj = new URL(url, window.location.origin)
  urlObj.searchParams.set("lang", currentLang)
  return urlObj.toString()
}

// Server-safe version that doesn't depend on window
export function addLanguageToUrlServer(url: string, currentLang: string): string {
  if (currentLang === "en") return url
  
  const urlObj = new URL(url, "http://localhost") // Dummy origin for server
  urlObj.searchParams.set("lang", currentLang)
  return urlObj.toString()
}

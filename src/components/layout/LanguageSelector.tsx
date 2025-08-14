"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getLanguageInfo, languages, setLanguageInUrl, useCurrentLanguage } from "@/lib/language"
import { Globe } from "lucide-react"

export function LanguageSelector() {
  const currentLanguage = useCurrentLanguage()
  const selectedLanguage = getLanguageInfo(currentLanguage)
  
  const handleLanguageChange = (languageCode: string) => {
    setLanguageInUrl(languageCode)
    // Navigate to current page with language parameter to trigger re-render
    const url = new URL(window.location.href)
    if (languageCode === "en") {
      url.searchParams.delete("lang")
    } else {
      url.searchParams.set("lang", languageCode)
    }
    window.location.href = url.toString()
  }

  return (
    <div className="flex items-center gap-2">
      {/* Current language badge */}
      {selectedLanguage && selectedLanguage.code !== "en" && (
        <Badge 
          variant="secondary" 
          className="hidden sm:flex items-center gap-1 text-xs"
        >
          <span>{selectedLanguage.emoji}</span>
          <span className="hidden md:inline">{selectedLanguage.name}</span>
        </Badge>
      )}
      
      {/* Language dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative flex items-center gap-1"
          >
            {selectedLanguage ? (
              <>
                <span className="text-sm">{selectedLanguage.emoji}</span>
                <span className="hidden lg:inline text-xs">{selectedLanguage.code.toUpperCase()}</span>
              </>
            ) : (
              <Globe className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b">
            Select Language
          </div>
          {languages.map((language) => {
            const isSelected = currentLanguage === language.code
            return (
              <DropdownMenuItem
                key={language.code}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => handleLanguageChange(language.code)}
              >
                <span className="text-lg">{language.emoji}</span>
                <span className="flex-1">{language.name}</span>
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

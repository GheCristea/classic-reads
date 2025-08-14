"use client"

import { SearchField } from "@/components/common/SearchField"
import { Button } from "@/components/ui/button"
import { useCurrentLanguage } from "@/lib/language"
import { BookOpen, Menu, X } from "lucide-react"
import Link from "next/link"
import React from "react"
import { LanguageSelector } from "./LanguageSelector"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  const currentLanguage = useCurrentLanguage()
  const primaryNavigationItems: Array<{ href: string; label: string }> = [
    { href: "/books", label: "Browse Books" },
    { href: "/authors", label: "Authors" },
    { href: "/subjects", label: "Subjects" },
  ]

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-full overflow-x-hidden flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link 
            href={currentLanguage === "en" ? "/" : `/?lang=${currentLanguage}`} 
            className="flex items-center space-x-2" 
            onClick={closeMenu}
          >
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Classic Reads</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {primaryNavigationItems.map((item) => (
              <Link
                key={item.href}
                href={currentLanguage === "en" ? item.href : `${item.href}?lang=${currentLanguage}`}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-sm ml-6">
            <SearchField size="sm" showButton={false} />
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <LanguageSelector />
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((v) => !v)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t overflow-x-hidden">
          <div className="container mx-auto px-4 py-4 h-full overflow-y-auto">
            <div className="mb-4">
              <SearchField size="md" showButton={true} onSearchSubmit={closeMenu} />
            </div>

            <div className="mb-4 pb-4 border-b flex items-baseline gap-1">
              <div className="text-sm font-medium text-muted-foreground mb-2">Language</div>
              <LanguageSelector />
            </div>

            <nav className="flex flex-col space-y-2">
              {primaryNavigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={currentLanguage === "en" ? item.href : `${item.href}?lang=${currentLanguage}`}
                  className="py-3 px-2 rounded-md text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
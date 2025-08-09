import { SearchField } from "@/components/common/SearchField"
import { Button } from "@/components/ui/button"
import { BookOpen, Menu } from "lucide-react"
import Link from "next/link"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Classic Reads</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            href="/books" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Browse Books
          </Link>
          <Link 
            href="/authors" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Authors
          </Link>
          <Link 
            href="/subjects" 
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Subjects
          </Link>
        </nav>

        {/* Search Bar */}
        <div className="hidden sm:flex flex-1 max-w-sm ml-6">
          <SearchField size="sm" showButton={false} />
        </div>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
} 
import { BookOpen, Heart } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto max-w-full px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-bold">Classic Reads</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Discover and explore the timeless classics from Project Gutenberg&apos;s vast collection of free books.
            </p>
          </div>

          {/* Browse */}
          <div className="space-y-3">
            <h3 className="font-semibold">Browse</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/books" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Books
                </Link>
              </li>
              <li>
                <Link href="/authors" className="text-muted-foreground hover:text-foreground transition-colors">
                  Authors
                </Link>
              </li>
              <li>
                <Link href="/subjects" className="text-muted-foreground hover:text-foreground transition-colors">
                  Subjects
                </Link>
              </li>
              <li>
                <Link href="/books?sort=popular" className="text-muted-foreground hover:text-foreground transition-colors">
                  Popular Books
                </Link>
              </li>
            </ul>
          </div>

          {/* Genres */}
          <div className="space-y-3">
            <h3 className="font-semibold">Popular Genres</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/books?topic=Fiction" className="text-muted-foreground hover:text-foreground transition-colors">
                  Fiction
                </Link>
              </li>
              <li>
                <Link href="/books?topic=Philosophy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Philosophy
                </Link>
              </li>
              <li>
                <Link href="/books?topic=Poetry" className="text-muted-foreground hover:text-foreground transition-colors">
                  Poetry
                </Link>
              </li>
              <li>
                <Link href="/books?topic=History" className="text-muted-foreground hover:text-foreground transition-colors">
                  History
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div className="space-y-3">
            <h3 className="font-semibold">About</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.gutenberg.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Project Gutenberg
                </a>
              </li>
              <li>
                <a 
                  href="https://gutendex.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Gutendx API
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Built with <Heart className="inline h-4 w-4 text-red-500" /> using Next.js and the Gutendx API
          </p>
          <p className="text-sm text-muted-foreground mt-2 sm:mt-0">
            © 2025 Classic Reads. All books are in the public domain.
          </p>
        </div>
      </div>
    </footer>
  )
} 
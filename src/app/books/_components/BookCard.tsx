import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Book as BookType, formatAuthors, getEpubFormat } from "@/lib/gutendx"
import { truncateText } from "@/lib/utils"
import { Book as BookIcon, Download, User } from "lucide-react"
import Link from "next/link"
import StartReadingButton from "./StartReadingButton"

interface BookCardProps {
  book: BookType
  showFullDetails?: boolean
}

export function BookCard({ book, showFullDetails = false }: BookCardProps) {
  const authorText = formatAuthors(book.authors)
  const primarySubject = book.subjects[0] || "General"
  const language = book.languages[0]?.toUpperCase() || "EN"
  
  // Get the best download format (prefer EPUB, then PDF, then HTML)
  const preferredFormats = ['epub', 'pdf', 'html']
  const downloadLink = Object.entries(book.formats).find(([mimeType]) => 
    preferredFormats.some(format => mimeType.includes(format))
  )?.[1]

  // Check if EPUB is available for online reading
  const epubFormat = getEpubFormat(book)

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight line-clamp-2">
            <Link 
              href={`/books/${book.id}`}
              className="hover:text-primary transition-colors"
            >
              {book.title}
            </Link>
          </CardTitle>
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="text-xs shrink-0">
              {language}
            </Badge>
            {epubFormat && (
              <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                <BookIcon className="h-2 w-2 mr-1" />
                Read
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <User className="h-3 w-3" />
          <span className="line-clamp-1">{authorText}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pt-0">
        {showFullDetails && book.subjects.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {truncateText(primarySubject, 100)}
            </p>
            <div className="flex flex-wrap gap-1">
              {book.subjects.slice(0, 3).map((subject, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {truncateText(subject, 20)}
                </Badge>
              ))}
              {book.subjects.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{book.subjects.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {!showFullDetails && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {truncateText(primarySubject, 60)}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-3 flex flex-col gap-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              <span>{book.download_count.toLocaleString()}</span>
            </div>
            {book.copyright !== null && (
              <Badge variant={book.copyright ? "destructive" : "secondary"} className="text-xs">
                {book.copyright ? "©" : "Public Domain"}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 w-full">
          {epubFormat && (
            <StartReadingButton
              epubUrl={epubFormat.url}
              bookId={book.id}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            />
          )}
          <Button asChild size="sm" variant="outline" className={epubFormat ? "flex-1" : "flex-1"}>
            <Link href={`/books/${book.id}`}>
              View
            </Link>
          </Button>
          {downloadLink && (
            <Button asChild size="sm" variant="outline" className="flex-1">
              <a href={downloadLink} target="_blank" rel="noopener noreferrer">
                Download
              </a>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
} 
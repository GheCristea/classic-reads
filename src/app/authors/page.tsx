import { getBooksByAuthor } from "@/lib/gutendx"
import { getAuthorMetadata, getAuthorPortraitUrl } from "@/lib/wikipedia"
import { AuthorCard } from "./_components/AuthorCard"
import { AuthorSearch } from "./_components/AuthorSearch"

const popularAuthors = [
  "William Shakespeare",
  "Jane Austen",
  "Charles Dickens",
  "Mark Twain",
  "Leo Tolstoy",
  "Fyodor Dostoevsky",
  "H. G. Wells",
  "Mary Shelley",
  "Edgar Allan Poe",
  "Arthur Conan Doyle",
  "Friedrich Nietzsche",
  "Ernest Hemingway",
  "J. R. R. Tolkien",
  "Harper Lee",
  "Herman Melville",
  "Virginia Woolf",
  "George Orwell",
  "Oscar Wilde",
];

async function PopularAuthorsGrid() {
  const portraits = await Promise.all(
    popularAuthors.map(async (name) => {
      const [portrait, meta] = await Promise.all([
        getAuthorPortraitUrl(name, 360),
        getAuthorMetadata(name),
      ])

      let topTitles: string[] = []
      try {
        const booksRes = await getBooksByAuthor(name)
        const seen = new Set<string>()
        topTitles = booksRes.results
          .sort((a, b) => b.download_count - a.download_count)
          .map((b) => b.title)
          .filter((t) => {
            if (seen.has(t)) return false
            seen.add(t)
            return true
          })
          .slice(0, 3)
      } catch {
        topTitles = []
      }

      return { name, portrait, meta, topTitles }
    })
  )

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {portraits.filter(p => p.portrait).map(({ name, portrait, meta, topTitles }) => (
        <AuthorCard key={name} name={name} portrait={portrait!} meta={meta} topTitles={topTitles} />
      ))}
    </div>
  )
}

export default function AuthorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-10 text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold">Browse by Author</h1>
        <p className="text-muted-foreground">Search or pick from popular authors</p>
        <div className="max-w-xl mx-auto mt-4">
          <AuthorSearch />
        </div>
      </div>

      {/* Popular authors with portraits */}
      <PopularAuthorsGrid />
    </div>
  )
}



import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getAuthorPortraitUrl } from "@/lib/wikipedia"
import { AuthorSearch } from "./_components/AuthorSearch"

export const dynamic = 'force-static'
export const revalidate = 300

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
    popularAuthors.map(async (name) => ({
      name,
      portrait: await getAuthorPortraitUrl(name, 320),
    }))
  )

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {portraits.filter(p => p.portrait).map(({ name, portrait }) => (
        <Card key={name} className="group relative overflow-hidden hover:shadow-md transition-shadow">
          {portrait ? (
            <div className="relative w-full h-72 bg-muted overflow-hidden">
              <img
                src={portrait}
                alt={name}
                className="absolute inset-0 w-full object-cover transition-transform duration-500 origin-top -translate-y-[15%] group-hover:scale-105"
                loading="lazy"
              />

              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300" />

              {/* Hover content */}
              <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300">
                <h3 className="text-white text-lg md:text-xl font-semibold drop-shadow">{name}</h3>
                <div className="mt-2">
                  <Button asChild size="sm" variant="secondary" className="shadow">
                    <a href={`/search?q=${encodeURIComponent(name)}`} aria-label={`View books by ${name}`}>View books</a>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-56 md:h-64 bg-muted" />
          )}
        </Card>
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



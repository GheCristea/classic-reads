import ClientReader from '@/components/epub-reader/ClientReader'
import { fetchBookById } from '@/lib/gutendx'

interface ReaderPageProps {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = "force-dynamic"

export default async function ReaderPage(props: ReaderPageProps) {
  const { sessionId } = await props.params
  const sp = await props.searchParams

  if (!sessionId) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Invalid reader session</p>
          <a className="text-primary underline" href="#" onClick={(e) => { e.preventDefault(); history.back() }}>Go back</a>
        </div>
      </div>
    )
  }

  // Build default meta, optionally enrich from book id in query
  let title = 'Untitled'
  let author = ''
  let progressKey: string | undefined = undefined

  const bookIdRaw = sp.b as string | undefined
  if (bookIdRaw) {
    try {
      const book = await fetchBookById(Number(bookIdRaw))
      title = book.title
      author = (book.authors && book.authors.length > 0) ? book.authors.map(a => a.name).join(', ') : ''
      const epubUrl = (book.formats && Object.entries(book.formats).find(([k]) => k.includes('epub'))?.[1]) || undefined
      progressKey = epubUrl
    } catch {}
  }

  const url = `/epub-files/${sessionId}.epub`

  return (
    <ClientReader
      url={url}
      title={title}
      author={author}
      progressKey={progressKey}
    />
  )
}



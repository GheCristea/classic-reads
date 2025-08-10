"use client"

import { EpubReader } from '@/components/EpubReader'
import { fetchBookById } from '@/lib/gutendx'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ReaderPage() {
  const params = useParams<{ sessionId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const sessionId = params?.sessionId
  const hasSession = Boolean(sessionId)

  const compactBookId = searchParams.get('b')
  const [meta, setMeta] = useState<{ title: string; author: string; progressKey?: string }>({ title: 'Untitled', author: '' })

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        if (compactBookId) {
          const book = await fetchBookById(Number(compactBookId))
          if (!mounted) return
          const authorText = (book.authors && book.authors.length > 0)
            ? book.authors.map(a => a.name).join(', ')
            : ''
          // Prefer stable progress key from original EPUB URL if available
          const epubUrl = (book.formats && Object.entries(book.formats).find(([k]) => k.includes('epub'))?.[1]) || undefined
          setMeta({ title: book.title, author: authorText, progressKey: epubUrl })
        }
      } catch {
        // Ignore meta errors; fallback to defaults
      }
    })()
    return () => { mounted = false }
  }, [compactBookId])

  if (!hasSession) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Invalid reader session</p>
          <button
            className="text-primary underline"
            onClick={() => router.back()}
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const url = `/epub-files/${sessionId}.epub`

  return (
    <EpubReader
      url={url}
      title={meta.title}
      author={meta.author}
      progressKey={meta.progressKey}
      onClose={() => router.back()}
    />
  )
}



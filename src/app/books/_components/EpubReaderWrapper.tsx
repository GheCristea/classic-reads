"use client"

import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface EpubReaderWrapperProps {
  epubUrl: string
  bookId?: number
}

export function EpubReaderWrapper({ epubUrl, bookId }: EpubReaderWrapperProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const openReader = async () => {
    setIsLoading(true)
    
    try {
      // Create an EPUB session
      const response = await fetch('/api/epub-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ epubUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to create EPUB session')
      }

      const data = await response.json()

      // Set session cookie for middleware (used for any direct content paths)
      document.cookie = `epub-session-id=${data.sessionId}; path=/; max-age=7200`

      // Prefer compact URL: only include book id if available
      const url = bookId
        ? `/read/${data.sessionId}?b=${encodeURIComponent(String(bookId))}`
        : `/read/${data.sessionId}`
      router.push(url)
    } catch (error) {
      console.error('Error opening EPUB reader:', error)
      alert('Failed to open EPUB reader. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">Available for immediate reading</span>
          </div>
        </div>
        
        <Button 
          onClick={openReader}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          size="lg"
        >
          <Play className="mr-2 h-5 w-5" />
          {isLoading ? 'Loading...' : 'Start Reading Online'}
        </Button>
        
        <p className="text-xs text-green-700">
          • Resume from where you left off
          • Navigate with table of contents
          • Adjustable text settings
          • No download required
        </p>
      </div>
    </>
  )
} 

"use client"

import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useState } from 'react'

interface EpubReaderWrapperProps {
  epubUrl: string
  title: string
  author: string
}

export function EpubReaderWrapper({ epubUrl, title, author }: EpubReaderWrapperProps) {
  const [isReaderOpen, setIsReaderOpen] = useState(false)
  const [sessionUrl, setSessionUrl] = useState<string | null>(null)
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
      
      // Set session cookie for middleware
      document.cookie = `epub-session-id=${data.sessionId}; path=/; max-age=7200`
      
      setSessionUrl(data.epubUrl)
      setIsReaderOpen(true)
      
      // Prevent background scrolling when reader is open
      document.body.style.overflow = 'hidden'
    } catch (error) {
      console.error('Error opening EPUB reader:', error)
      alert('Failed to open EPUB reader. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const closeReader = () => {
    setIsReaderOpen(false)
    setSessionUrl(null)
    
    // Clear session cookie
    document.cookie = 'epub-session-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    
    // Restore background scrolling
    document.body.style.overflow = 'unset'
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

      {/* EPUB Reader Modal */}
      {isReaderOpen && sessionUrl && (
        <DynamicEpubReader
          url={sessionUrl}
          title={title}
          author={author}
          progressKey={epubUrl}
          onClose={closeReader}
        />
      )}
    </>
  )
} 

// Lazy-load heavy reader only when needed
const DynamicEpubReader = dynamic(() => import('@/components/EpubReader').then(m => m.EpubReader), {
  ssr: false,
})
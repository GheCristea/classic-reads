"use client"

import { EpubReader } from '@/components/EpubReader'
import { useRouter } from 'next/navigation'

interface ClientReaderProps {
  url: string
  title: string
  author: string
  progressKey?: string
}

export default function ClientReader({ url, title, author, progressKey }: ClientReaderProps) {
  const router = useRouter()
  return (
    <EpubReader
      url={url}
      title={title}
      author={author}
      progressKey={progressKey}
      onClose={() => router.back()}
    />
  )
}



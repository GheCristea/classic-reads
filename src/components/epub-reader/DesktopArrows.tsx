"use client"

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type DesktopArrowsProps = {
  visible: boolean
  isNavigating: boolean
  onPrev: () => void
  onNext: () => void
}

export default function DesktopArrows(props: DesktopArrowsProps) {
  const { visible, isNavigating, onPrev, onNext } = props
  if (!visible) return null

  return (
    <>
      <div className="hidden md:block absolute top-1/2 left-4 transform -translate-y-1/2 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onPrev()
          }}
          className="bg-background/80 hover:bg-background shadow h-11 w-11 backdrop-blur-sm"
          disabled={isNavigating}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="hidden md:block absolute top-1/2 right-4 transform -translate-y-1/2 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onNext()
          }}
          className="bg-background/80 hover:bg-background shadow h-11 w-11 backdrop-blur-sm"
          disabled={isNavigating}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </>
  )
}



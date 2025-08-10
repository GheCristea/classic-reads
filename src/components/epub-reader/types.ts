import type { Rendition } from 'epubjs';

export type EpubDisplayed = { page: number; total: number }

export type EpubLocation = {
  start?: {
    cfi?: string
    index?: number
    percentage?: number
    displayed?: EpubDisplayed
  }
  end?: unknown
}

export type EpubLocationsApi = {
  total?: number
  generate?: (breakpoint?: number) => Promise<void>
  cfiFromPercentage?: (percentage: number) => string | number
}

export type EpubBookApi = {
  ready?: Promise<void>
  locations?: EpubLocationsApi
}

export type RenditionWithBook = Rendition & {
  book?: EpubBookApi
  currentLocation?: () => EpubLocation
  emit?: (event: string, payload: unknown) => void
}

export type EpubContentsLike = { document?: Document }

export type ExtendedStyle = CSSStyleDeclaration & { webkitUserSelect?: string }



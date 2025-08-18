// lib/gutendx.ts - Gutendx API client functions

export interface Author {
  name: string;
  birth_year: number | null;
  death_year: number | null;
}

export interface BookFormat {
  [key: string]: string; // MIME type as key, URL as value
}

export interface Book {
  id: number;
  title: string;
  authors: Author[];
  translators: Author[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean | null;
  media_type: string;
  formats: BookFormat;
  download_count: number;
}

export interface BooksResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Book[];
}

export interface SearchParams {
  search?: string;
  author_year_start?: number;
  author_year_end?: number;
  copyright?: boolean | null;
  languages?: string[];
  mime_type?: string;
  sort?: 'popular' | 'ascending' | 'descending';
  topic?: string;
  ids?: number[];
  page?: number;
}

const GUTENDX_BASE_URL = 'https://gutendex.com';

/**
 * Builds query string from search parameters
 */
function buildQueryString(params: SearchParams): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.set(key, value.join(','));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  return searchParams.toString();
}

/**
 * Fetches books from Gutendx API with optional filters
 */
export async function fetchBooks(params: SearchParams = {}): Promise<BooksResponse> {
  const queryString = buildQueryString(params);
  // On server (build/SSR), fetch Gutendex directly with revalidation to enable static generation.
  // On client, go through our cached API route for SWR + Supabase persistence.
  const isBrowser = typeof window !== 'undefined'
  const url = isBrowser
    ? `/api/gx/search${queryString ? `?${queryString}` : ''}`
    : `${GUTENDX_BASE_URL}/books${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await fetch(url, isBrowser ? { cache: 'no-store' } : { next: { revalidate: 3600 } });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BooksResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw new Error('Failed to fetch books from Gutendx API');
  }
}

/**
 * Fetches a single book by ID
 */
export async function fetchBookById(id: number): Promise<Book> {
  const url = `${GUTENDX_BASE_URL}/books/${id}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Book not found');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const book: Book = await response.json();
    return book;
  } catch (error) {
    console.error(`Error fetching book ${id}:`, error);
    throw error;
  }
}

/**
 * Searches books with debounced query
 */
export async function searchBooks(
  query: string,
  filters: Omit<SearchParams, 'search'> = {}
): Promise<BooksResponse> {
  if (!query.trim()) {
    return { count: 0, next: null, previous: null, results: [] };
  }

  return fetchBooks({
    search: query.trim(),
    ...filters
  });
}

/**
 * Gets popular books (default sort)
 */
export async function getPopularBooks(limit = 32): Promise<Book[]> {
  const response = await fetchBooks({ sort: 'popular' });
  return response.results.slice(0, limit);
}

/**
 * Gets books by author name
 */
export async function getBooksByAuthor(
  authorName: string,
  page = 1
): Promise<BooksResponse> {
  return fetchBooks({
    search: authorName,
    page
  });
}

/**
 * Gets books by subject/topic
 */
export async function getBooksBySubject(
  subject: string,
  page = 1
): Promise<BooksResponse> {
  return fetchBooks({
    topic: subject,
    page
  });
}

/**
 * Gets books by language
 */
export async function getBooksByLanguage(
  language: string,
  page = 1
): Promise<BooksResponse> {
  return fetchBooks({
    languages: [language],
    page
  });
}

/**
 * Gets available download formats for a book
 */
export function getBookFormats(book: Book) {
  const formats = Object.entries(book.formats).map(([mimeType, url]) => {
    // Extract file extension and format name
    let formatName = mimeType;
    let extension = '';

    if (mimeType.includes('epub')) {
      formatName = 'EPUB';
      extension = '.epub';
    } else if (mimeType.includes('pdf')) {
      formatName = 'PDF';
      extension = '.pdf';
    } else if (mimeType.includes('text/plain')) {
      formatName = 'Plain Text';
      extension = '.txt';
    } else if (mimeType.includes('text/html')) {
      formatName = 'HTML';
      extension = '.html';
    } else if (mimeType.includes('kindle') || mimeType.includes('mobipocket')) {
      formatName = 'Kindle';
      extension = '.mobi';
    } else if (mimeType.includes('rdf+xml')) {
      formatName = 'RDF';
      extension = '.rdf';
    }

    return {
      mimeType,
      url,
      formatName,
      extension
    };
  });

  return formats;
}

/**
 * Gets the cover image URL for a book
 */
export function getBookCoverUrl(book: Book): string | null {
  const imageFormat = Object.entries(book.formats).find(([mimeType]) =>
    mimeType.includes('image/')
  );

  return imageFormat ? imageFormat[1] : null;
}

/**
 * Formats author names for display
 */
export function formatAuthors(authors: Author[]): string {
  if (authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return authors[0].name;
  if (authors.length === 2) return `${authors[0].name} and ${authors[1].name}`;
  
  return `${authors[0].name} and ${authors.length - 1} others`;
}

/**
 * Gets suggested search terms based on popular subjects
 */
export function getSuggestedSearchTerms(): string[] {
  return [
    'Charles Dickens',
    'Jane Austen',
    'Shakespeare',
    'Mark Twain',
    'Adventure',
    'Romance',
    'Mystery',
    'Science Fiction',
    'Philosophy',
    'History',
    'Poetry',
    'Children\'s Literature'
  ];
}

/**
 * Validates and normalizes language codes
 */
export function normalizeLanguageCode(lang: string): string {
  const languageCodes: { [key: string]: string } = {
    'en': 'English',
    'fr': 'French',
    'de': 'German',
    'es': 'Spanish',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'da': 'Danish',
    'no': 'Norwegian',
    'fi': 'Finnish',
    'pl': 'Polish',
    'cs': 'Czech',
    'hu': 'Hungarian'
  };

  return languageCodes[lang] || lang.toUpperCase();
}

/**
 * Error handling utility for API calls
 */
export class GutendxError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'GutendxError';
  }
}

/**
 * Rate limiting utility (client-side)
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 10;
  private readonly timeWindow = 60000; // 1 minute

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getRetryAfter(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.timeWindow - (Date.now() - oldestRequest));
  }
}

export const rateLimiter = new RateLimiter(); 

// Helper function to get proxied EPUB URL
export function getProxiedEpubUrl(originalUrl: string): string {
  return `/api/epub?url=${encodeURIComponent(originalUrl)}`
}

// Helper function to get EPUB format specifically
export function getEpubFormat(book: Book): BookFormat | null {
  const formats = getBookFormats(book)
  return formats.find(format => format.formatName === 'EPUB') || null
} 
import type { ExternalBookSearchCandidate } from '../types/api'

interface OpenBdResponse {
  summary?: {
    cover?: string
  }
}

interface OpenLibrarySearchResponse {
  docs?: {
    cover_i?: number
    isbn?: string[]
    title?: string
  }[]
}

interface GoogleBooksResponse {
  items?: {
    volumeInfo?: {
      imageLinks?: {
        thumbnail?: string
        smallThumbnail?: string
      }
    }
  }[]
}

export async function enrichBookCovers<T extends ExternalBookSearchCandidate>(candidates: T[]) {
  return Promise.all(candidates.map(enrichBookCover))
}

export interface BookCoverLookupInput {
  isbn13?: string | null
  isbn10?: string | null
  title: string
  thumbnailUrl?: string | null
}

export async function lookupBestBookCover(book: BookCoverLookupInput) {
  const hasInvalidThumbnail = book.thumbnailUrl ? await shouldReplaceThumbnail(book.thumbnailUrl) : false
  if (book.thumbnailUrl && !hasInvalidThumbnail) {
    return book.thumbnailUrl
  }

  const isbn = book.isbn13 ?? book.isbn10
  return isbn
    ? firstCover([
        () => lookupOpenBdCover(isbn),
        () => lookupBooksOrJpCover(isbn),
        () => lookupGoogleCover(`isbn:${isbn.replace(/[-\s]/g, '')}`),
        () => lookupOpenLibraryCoverByIsbn(isbn),
        () => lookupGoogleCover(book.title),
        () => lookupOpenLibraryCoverByTitle(book.title),
      ])
    : firstCover([
        () => lookupGoogleCover(book.title),
        () => lookupOpenLibraryCoverByTitle(book.title),
      ])
}

async function enrichBookCover<T extends ExternalBookSearchCandidate>(candidate: T): Promise<T> {
  const hadThumbnail = Boolean(candidate.thumbnailUrl)
  const coverUrl = await lookupBestBookCover(candidate)
  if (coverUrl) {
    return { ...candidate, thumbnailUrl: coverUrl }
  }
  return hadThumbnail ? { ...candidate, thumbnailUrl: null } : candidate
}

async function shouldReplaceThumbnail(url: string) {
  if (!url.startsWith('/external/books-image/') && !url.startsWith('/external/openlibrary/')) {
    return false
  }
  return !(await imageExists(url))
}

async function firstCover(lookups: (() => Promise<string | null>)[]) {
  for (const lookup of lookups) {
    const value = await lookup()
    if (value) return value
  }
  return null
}

async function lookupOpenBdCover(isbn: string) {
  const response = await fetch(`/external/openbd/v1/get?isbn=${encodeURIComponent(isbn.replace(/[-\s]/g, ''))}`)
  if (!response.ok) return null
  const data = (await response.json()) as (OpenBdResponse | null)[]
  return data[0]?.summary?.cover || null
}

async function lookupBooksOrJpCover(isbn: string) {
  const cleaned = isbn.replace(/[-\s]/g, '')
  if (!/^\d{13}$/.test(cleaned)) return null

  const url = `/external/books-image/${encodeURIComponent(cleaned)}.jpg`
  return (await imageExists(url)) ? url : null
}

async function lookupOpenLibraryCoverByIsbn(isbn: string) {
  const cleaned = isbn.replace(/[-\s]/g, '')
  const url = `/external/openlibrary/covers/b/isbn/${encodeURIComponent(cleaned)}-M.jpg?default=false`
  return (await imageExists(url)) ? url : null
}

async function lookupOpenLibraryCoverByTitle(title: string) {
  const params = new URLSearchParams({ title, limit: '3' })
  const response = await fetch(`/external/openlibrary/search.json?${params.toString()}`)
  if (!response.ok) return null
  const data = (await response.json()) as OpenLibrarySearchResponse
  for (const doc of data.docs ?? []) {
    if (!doc.cover_i) continue
    const url = `/external/openlibrary/covers/b/id/${doc.cover_i}-M.jpg`
    if (await imageExists(url)) return url
  }
  return null
}

async function lookupGoogleCover(query: string) {
  const params = new URLSearchParams({ q: query, maxResults: '1' })
  const response = await fetch(`/external/google/books/v1/volumes?${params.toString()}`)
  if (!response.ok) return null
  const data = (await response.json()) as GoogleBooksResponse
  const links = data.items?.[0]?.volumeInfo?.imageLinks
  return links?.thumbnail ?? links?.smallThumbnail ?? null
}

async function imageExists(url: string) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

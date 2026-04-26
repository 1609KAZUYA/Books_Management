import axios from 'axios'
import type { ExternalBookSearchCandidate, ExternalBookSearchType, SourceName } from '../types/api'

interface GoogleBooksVolume {
  volumeInfo?: {
    title?: string
    subtitle?: string
    authors?: string[]
    publisher?: string
    publishedDate?: string
    description?: string
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    industryIdentifiers?: {
      type?: string
      identifier?: string
    }[]
  }
}

interface GoogleBooksResponse {
  items?: GoogleBooksVolume[]
}

type GoogleBooksIdentifier = NonNullable<GoogleBooksVolume['volumeInfo']>['industryIdentifiers']

export async function searchGoogleBooks(
  query: string,
  type: ExternalBookSearchType = 'KEYWORD',
  maxResults = 10,
) {
  const queries = toGoogleQueries(query, type)
  const results = new Map<string, ExternalBookSearchCandidate>()

  for (const googleQuery of queries) {
    const response = await axios.get<GoogleBooksResponse>('/external/google/books/v1/volumes', {
      params: { q: googleQuery, maxResults },
    })
    for (const item of response.data.items ?? []) {
      const candidate = toCandidate(item)
      if (!candidate) continue
      results.set(candidateKey(candidate), candidate)
      if (results.size >= maxResults) break
    }
    if (results.size >= maxResults) break
  }

  return [...results.values()].slice(0, maxResults)
}

function toGoogleQueries(query: string, type: ExternalBookSearchType) {
  const trimmed = query.trim()
  if (type === 'ISBN') return [`isbn:${trimmed.replace(/[-\s]/g, '')}`]
  if (type === 'TITLE') return [`intitle:${trimmed}`, trimmed]
  if (type === 'AUTHOR') return [`inauthor:${trimmed}`, trimmed]
  return [trimmed]
}

function toCandidate(item: GoogleBooksVolume): ExternalBookSearchCandidate | null {
  const info = item.volumeInfo
  if (!info?.title) return null

  const isbn13 = findIdentifier(info.industryIdentifiers, 'ISBN_13')
  const isbn10 = findIdentifier(info.industryIdentifiers, 'ISBN_10')
  return {
    isbn13,
    isbn10,
    title: info.title,
    subtitle: info.subtitle ?? null,
    authors: info.authors ?? [],
    publisher: info.publisher ?? null,
    publishedDate: normalizePublishedDate(info.publishedDate),
    description: info.description ?? null,
    thumbnailUrl: info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null,
    sourceName: 'GOOGLE_BOOKS' as SourceName,
  }
}

function findIdentifier(identifiers: GoogleBooksIdentifier, type: string) {
  return identifiers?.find((identifier) => identifier.type === type)?.identifier?.replace(/[-\s]/g, '') ?? null
}

function normalizePublishedDate(value?: string) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`
  if (/^\d{4}$/.test(value)) return `${value}-01-01`
  return null
}

function candidateKey(candidate: ExternalBookSearchCandidate) {
  if (candidate.isbn13) return `isbn13:${candidate.isbn13}`
  if (candidate.isbn10) return `isbn10:${candidate.isbn10}`
  return `title:${candidate.title.toLowerCase()}:${candidate.authors.join(',').toLowerCase()}`
}

import apiClient from './client'
import type { IsbnLookupResponse } from '../types/api'
import { enrichBookCovers } from './coverLookup'
import { searchGoogleBooks } from './googleBooks'
import { searchNdlBooks } from './ndlSearch'

export const lookupIsbn = (isbn: string) =>
  apiClient
    .get<IsbnLookupResponse>(`/isbn/${isbn}`)
    .then(async (r) => {
      if (r.data.candidates.length > 0) {
        return { ...r.data, candidates: await enrichBookCovers(r.data.candidates) }
      }
      return lookupGoogleBooksIsbn(isbn)
    })
    .catch(() => lookupGoogleBooksIsbn(isbn))

async function lookupGoogleBooksIsbn(isbn: string): Promise<IsbnLookupResponse> {
  const fallbackIsbn13 = normalizeToIsbn13(isbn)
  let sourceCandidates = await searchNdlBooks(isbn, 'ISBN', 5)
  if (sourceCandidates.length === 0) {
    sourceCandidates = await searchGoogleBooks(isbn, 'ISBN', 5)
  }
  const candidatesWithIsbn = sourceCandidates
    .map((candidate) => ({
      ...candidate,
      isbn13: candidate.isbn13 ?? fallbackIsbn13,
    }))
    .filter((candidate) => candidate.isbn13)

  const candidates = (await enrichBookCovers(candidatesWithIsbn))
    .map((candidate) => ({
      ...candidate,
      isbn13: candidate.isbn13 as string,
      cacheHit: false,
    }))
  return { queryIsbn: isbn, candidates }
}

function normalizeToIsbn13(value: string) {
  const cleaned = value.replace(/[-\s]/g, '').toUpperCase()
  if (/^\d{13}$/.test(cleaned)) return cleaned
  if (!/^\d{9}[\dX]$/.test(cleaned)) return null

  const body = `978${cleaned.slice(0, 9)}`
  let sum = 0
  for (let i = 0; i < body.length; i += 1) {
    sum += Number(body[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return `${body}${checkDigit}`
}

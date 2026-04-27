import { useEffect, useState } from 'react'
import { lookupBestBookCover } from '../api/coverLookup'
import type { BookMasterSummary } from '../types/api'

interface BookCoverImageProps {
  book: BookMasterSummary
  className: string
  placeholderClassName: string
  placeholderTextClassName?: string
}

export default function BookCoverImage({
  book,
  className,
  placeholderClassName,
  placeholderTextClassName = 'text-gray-400 text-xs',
}: BookCoverImageProps) {
  const [coverUrl, setCoverUrl] = useState(book.thumbnailUrl ?? null)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setCoverUrl(book.thumbnailUrl ?? null)
    setFailedUrl(null)

    if (!book.thumbnailUrl) {
      lookupBestBookCover(book).then((url) => {
        if (!cancelled) setCoverUrl(url)
      })
    }

    return () => {
      cancelled = true
    }
  }, [book.id, book.isbn13, book.isbn10, book.title, book.thumbnailUrl])

  const handleError = () => {
    const currentUrl = coverUrl
    if (!currentUrl || currentUrl === failedUrl) {
      setCoverUrl(null)
      return
    }

    setFailedUrl(currentUrl)
    lookupBestBookCover({ ...book, thumbnailUrl: null }).then((url) => {
      setCoverUrl(url && url !== currentUrl ? url : null)
    })
  }

  if (coverUrl) {
    return <img src={coverUrl} alt={book.title} className={className} onError={handleError} />
  }

  return (
    <div className={placeholderClassName}>
      <span className={placeholderTextClassName}>表紙なし</span>
    </div>
  )
}

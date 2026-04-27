import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { lookupBestBookCover } from '../api/coverLookup'
import type { BookMasterSummary } from '../types/api'
import { FONTS, hashColor, shade } from '../styles/editorial'

interface EditorialBookCoverProps {
  book: BookMasterSummary
  baseColor?: string | null
  width?: number | string
  height?: number | string
  aspectRatio?: string
  showTitle?: boolean
}

export default function EditorialBookCover({
  book,
  baseColor,
  width = '100%',
  height,
  aspectRatio = '2/3',
  showTitle = true,
}: EditorialBookCoverProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(book.thumbnailUrl ?? null)
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

  const color = baseColor ?? hashColor(book.title)

  const wrapper: CSSProperties = {
    width,
    height,
    aspectRatio,
    position: 'relative',
    overflow: 'hidden',
    background: `linear-gradient(135deg, ${shade(color, 12)}, ${shade(color, -25)})`,
    boxShadow:
      'inset -3px 0 6px rgba(0,0,0,0.18), inset 3px 0 0 rgba(255,255,255,0.08), 0 4px 8px rgba(42,32,26,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (coverUrl) {
    return (
      <div style={wrapper}>
        <img
          src={coverUrl}
          alt={book.title}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>
    )
  }

  return (
    <div style={wrapper}>
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          right: 8,
          bottom: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          pointerEvents: 'none',
        }}
      />
      {showTitle && (
        <div
          style={{
            fontFamily: FONTS.serif,
            color: 'rgba(255,255,255,0.92)',
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.3,
            letterSpacing: '0.02em',
            textAlign: 'center',
            padding: 14,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {book.title}
        </div>
      )}
    </div>
  )
}

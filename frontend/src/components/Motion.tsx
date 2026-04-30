import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { EDITORIAL, shade } from '../styles/editorial'

// 画面演出をまとめた共通コンポーネントです。
// Laravelでいうと、複数のBladeで使い回す小さなUI部品に近い役割です。

function useReducedMotion() {
  // OSやブラウザで「アニメーションを減らす」設定にしている人へ配慮します。
  // 動きが苦手なユーザーには、スクロール演出や常時アニメーションを止めます。
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(query.matches)

    const handleChange = () => setReduced(query.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return reduced
}

export function ScrollProgressBar({ color = EDITORIAL.accent }: { color?: string }) {
  // ページをどこまで読んだかを、画面上端の細いバーで見せます。
  // scrollイベントをそのまま毎回setStateせず、requestAnimationFrameで描画タイミングに合わせています。
  const [progress, setProgress] = useState(0)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    let frame = 0
    const updateProgress = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        setProgress(maxScroll <= 0 ? 0 : Math.min(1, window.scrollY / maxScroll))
      })
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [reducedMotion])

  if (reducedMotion) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 80,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: color,
          boxShadow: `0 0 18px ${color}66`,
          transform: `scaleX(${progress})`,
          transformOrigin: 'left center',
          transition: 'transform 80ms linear',
        }}
      />
    </div>
  )
}

export function Reveal({
  children,
  delay = 0,
  y = 22,
  style,
}: {
  children: ReactNode
  delay?: number
  y?: number
  style?: CSSProperties
}) {
  // 要素が画面内に入ったタイミングで、ふわっと表示するための部品です。
  // IntersectionObserverは「今この要素が見えているか」をブラウザに効率よく判定してもらうAPIです。
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true)
      return
    }

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [reducedMotion])

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0, 0, 0)' : `translate3d(0, ${y}px, 0)`,
        transition: reducedMotion
          ? 'none'
          : `opacity 620ms ease ${delay}ms, transform 720ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms`,
        willChange: reducedMotion ? 'auto' : 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

export function EditorialAtmosphere({ dark = false }: { dark?: boolean }) {
  // ページ背景に薄い紙の繊維や本の小口のような線を重ねます。
  // 操作できる要素ではないので aria-hidden と pointerEvents:none にしています。
  const lineColor = dark ? 'rgba(244,237,224,0.22)' : `${shade(EDITORIAL.accent, 8)}44`
  const warmLineColor = dark ? 'rgba(211,136,80,0.22)' : `${EDITORIAL.accent}2f`

  return (
    <div className="bm-atmosphere" aria-hidden="true">
      <span className="bm-atmosphere__strip" style={{ left: '8%', background: lineColor }} />
      <span
        className="bm-atmosphere__strip bm-atmosphere__strip--slow"
        style={{ left: '38%', background: warmLineColor }}
      />
      <span
        className="bm-atmosphere__strip bm-atmosphere__strip--wide"
        style={{ right: '12%', background: lineColor }}
      />
      <span
        className="bm-atmosphere__grain"
        style={{ opacity: dark ? 0.05 : 0.08 }}
      />
    </div>
  )
}

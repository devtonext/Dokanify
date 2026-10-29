import { useEffect, useState } from 'react'
import { Link, useAsset, useLocale, type Localized } from '@nexdrop/theme-sdk'

type Slide = { image: string; heading: Localized; subheading: Localized; buttonLabel: Localized; buttonLink: string }
type S = { slides: Slide[]; height: 'small' | 'medium' | 'large'; align: 'left' | 'center'; overlay: number; autoplay: boolean }

export function Hero({ settings }: { settings: S }) {
  const { t } = useLocale()
  const asset = useAsset()
  const slides = settings.slides || []
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!settings.autoplay || slides.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000)
    return () => clearInterval(timer)
  }, [settings.autoplay, slides.length])

  if (!slides.length) return null
  const slide = slides[Math.min(index, slides.length - 1)]

  return (
    <section className={`hero hero-${settings.height || 'large'} align-${settings.align || 'left'}`}>
      {slides.map((s, i) => (
        <div key={i} className={`hero-bg ${i === index ? 'active' : ''}`} style={{ backgroundImage: `url("${asset(s.image)}")` }} />
      ))}
      <div className="hero-overlay" style={{ opacity: (settings.overlay ?? 35) / 100 }} />
      <div className="container hero-content">
        <h1>{t(slide.heading)}</h1>
        {t(slide.subheading) && <p>{t(slide.subheading)}</p>}
        {t(slide.buttonLabel) && (
          <Link to={slide.buttonLink || '/collection/all'} className="btn btn-light">
            {t(slide.buttonLabel)}
          </Link>
        )}
      </div>
      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button key={i} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      )}
    </section>
  )
}

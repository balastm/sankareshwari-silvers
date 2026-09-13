'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

type GiftCategory = { id: string; name: string; image_url?: string | null; feature_kicker?: string | null; feature_title?: string | null; feature_font?: 'serif' | 'sans' | null; feature_order?: number | null; feature_enabled?: boolean }

export default function GiftUnboxing({ rate, categories = [] }: { rate: number; categories?: GiftCategory[] }) {
  const section = useRef<HTMLElement>(null)
  // The unboxing is the primary product story, so it remains scroll-driven on touch devices too.
  const reduced = false
  const rawProgress = useMotionValue(0)
  const progress = useSpring(rawProgress, { stiffness: 90, damping: 28, mass: .4 })
  useEffect(() => {
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const element = section.current
        if (!element) return
        const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
        const sectionTop = element.getBoundingClientRect().top + scrollTop
        const max = Math.max(1, element.offsetHeight - window.innerHeight)
        const travelled = scrollTop - sectionTop
        rawProgress.set(Math.max(0, Math.min(1, travelled / max)))
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [rawProgress])
  const lidY = useTransform(progress, [0, .15, .48, 1], ['0%', '0%', '-38%', '-38%'])
  const lidRotate = useTransform(progress, [0, .15, .48, 1], [0, 0, -24, -24])
  const lidOpacity = useTransform(progress, [0, .32, .52], [1, 1, 0])
  const camera = useTransform(progress, [0, .35, .85], [1, 1.06, 1.45])
  const boxOpacity = useTransform(progress, [.58, .82], [1, 0])
  const headingOpacity = useTransform(progress, [.12, .28], [1, 0])
  const poojaY = useTransform(progress, [.28, .86], ['30%', '-35%'])
  const giftY = useTransform(progress, [.28, .86], ['30%', '-35%'])
  const poojaX = useTransform(progress, [.28, .86], ['-20%', '-54%'])
  const giftX = useTransform(progress, [.28, .86], ['20%', '54%'])
  const poojaOpacity = useTransform(progress, [.28, .42], [0, 1])
  const giftOpacity = useTransform(progress, [.28, .42], [0, 1])
  const itemScale = useTransform(progress, [.28, .86], [.25, 1])
  const glow = useTransform(progress, [.15, .55], [0, .8])
  const featured = categories.filter(category => category.feature_enabled).sort((a,b)=>(a.feature_order||99)-(b.feature_order||99))
  const poojaCategory = featured[0] ?? categories.find(category => /pooja|puja|ritual|sacred/i.test(category.name)) ?? categories[0]
  const giftCategory = featured[1] ?? categories.find(category => /gift|treasure|celebr/i.test(category.name)) ?? categories.find(category => category.id !== poojaCategory?.id) ?? categories[1]
  const poojaImage = poojaCategory?.image_url || '/gift/pooja.jpg'
  const giftImage = giftCategory?.image_url || '/gift/gifts.jpg'
  const categoryHref = (category?: GiftCategory) => category ? `/#category-products-${category.id}` : '#products'
  const openCategory = (category?: GiftCategory) => {
    if (!category) return
    const hash = `#category-products-${category.id}`
    window.history.pushState(null, '', hash)
    window.dispatchEvent(new Event('hashchange'))
  }

  return <section ref={section} className={`gift-story${reduced ? ' gift-static' : ''}`} aria-label="A silver gift box opens to reveal pooja articles and gifts">
    <div className="gift-sticky">
      <motion.div className="gift-heading" style={{opacity: reduced ? 1 : headingOpacity}}>
        <div className="eyebrow">Sankareshwari Silvers · Gifts with meaning</div>
        <h1>A little silver.<br/><em>A lifetime of blessings.</em></h1>
        <p>Unwrap something extraordinary.</p>
      </motion.div>
      <motion.div className="gift-stage" style={{ scale: reduced ? 1 : camera }}>
        <div className="gift-shadow"/>
        <motion.div className="gift-light" style={{ opacity: reduced ? .8 : glow }}/>
        <motion.div className="gift-interior" style={{ opacity: reduced ? 0 : boxOpacity }}/>
        <motion.div className="gift-lid gift-box-layer" style={reduced ? { y: '-38%', rotate: -24, opacity: .15 } : { y: lidY, rotate: lidRotate, opacity: lidOpacity }}>
          <Image src="/gift/box.jpg" alt="" fill sizes="(max-width: 600px) 94vw, 650px" preload/>
        </motion.div>
        <motion.a href={categoryHref(poojaCategory)} onClick={(event) => { event.preventDefault(); openCategory(poojaCategory) }} className="gift-item gift-pooja" style={reduced ? { x: '-54%', y: '-35%' } : { x: poojaX, y: poojaY, opacity: poojaOpacity, scale: itemScale }} aria-label={`View ${poojaCategory?.name || 'Pooja'} products`}>
          <Image src={poojaImage} alt="Silver pooja set with lamps, kalash, bowls and a tray" width={736} height={877} sizes="(max-width: 600px) 40vw, 280px"/>
          <figcaption className={poojaCategory?.feature_font === 'sans' ? 'tile-sans' : ''}><span>01 / {poojaCategory?.feature_kicker || 'Sacred traditions'}</span>{poojaCategory?.feature_title || 'Pooja essentials'}</figcaption>
        </motion.a>
        <motion.a href={categoryHref(giftCategory)} onClick={(event) => { event.preventDefault(); openCategory(giftCategory) }} className="gift-item gift-treasures" style={reduced ? { x: '54%', y: '-35%' } : { x: giftX, y: giftY, opacity: giftOpacity, scale: itemScale }} aria-label={`View ${giftCategory?.name || 'Gift'} products`}>
          <Image src={giftImage} alt="Ornate silver dry fruit jars on a matching gift tray" width={736} height={736} sizes="(max-width: 600px) 40vw, 280px"/>
          <figcaption className={giftCategory?.feature_font === 'sans' ? 'tile-sans' : ''}><span>02 / {giftCategory?.feature_kicker || 'Thoughtful celebrations'}</span>{giftCategory?.feature_title || 'Timeless gifts'}</figcaption>
        </motion.a>
        <motion.div className="gift-base gift-box-layer" style={{ opacity: reduced ? 0 : boxOpacity }}><Image src="/gift/box.jpg" alt="Ornately engraved silver gift box" fill sizes="(max-width: 600px) 94vw, 650px" preload/></motion.div>
      </motion.div>
      <div className="gift-bottom"><span className="gift-scroll">{reduced ? 'Treasures for every occasion' : '↓ Scroll to unwrap'}</span><a className="btn btn-dark" href="#products">Explore the collection ↗</a><span className="gift-rate">{rate > 0 ? `Today’s silver · ₹${rate.toLocaleString('en-IN')}/g` : 'Made to be treasured'}</span></div>
      <motion.div className="gift-progress" style={{ scaleX: reduced ? 1 : progress }}/>
    </div>
  </section>
}

'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'

export default function GiftUnboxing({ rate }: { rate: number }) {
  const section = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 75, damping: 26, mass: .45 })
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
        <motion.figure className="gift-item gift-pooja" style={reduced ? { x: '-54%', y: '-35%' } : { x: poojaX, y: poojaY, opacity: poojaOpacity, scale: itemScale }}>
          <Image src="/gift/pooja.jpg" alt="Silver pooja set with lamps, kalash, bowls and a tray" width={736} height={877} sizes="(max-width: 600px) 40vw, 280px"/>
          <figcaption><span>01 / Sacred traditions</span>Pooja essentials</figcaption>
        </motion.figure>
        <motion.figure className="gift-item gift-treasures" style={reduced ? { x: '54%', y: '-35%' } : { x: giftX, y: giftY, opacity: giftOpacity, scale: itemScale }}>
          <Image src="/gift/gifts.jpg" alt="Ornate silver dry fruit jars on a matching gift tray" width={736} height={736} sizes="(max-width: 600px) 40vw, 280px"/>
          <figcaption><span>02 / Thoughtful celebrations</span>Timeless gifts</figcaption>
        </motion.figure>
        <motion.div className="gift-base gift-box-layer" style={{ opacity: reduced ? 0 : boxOpacity }}><Image src="/gift/box.jpg" alt="Ornately engraved silver gift box" fill sizes="(max-width: 600px) 94vw, 650px" preload/></motion.div>
      </motion.div>
      <div className="gift-bottom"><span className="gift-scroll">{reduced ? 'Treasures for every occasion' : '↓ Scroll to unwrap'}</span><a className="btn btn-dark" href="#products">Explore the collection ↗</a><span className="gift-rate">{rate > 0 ? `Today’s silver · ₹${rate.toLocaleString('en-IN')}/g` : 'Made to be treasured'}</span></div>
      <motion.div className="gift-progress" style={{ scaleX: reduced ? 1 : progress }}/>
    </div>
  </section>
}

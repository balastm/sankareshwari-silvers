'use client'
import { motion, useReducedMotion } from 'motion/react'

export default function Reveal({children, delay=0}:{children:React.ReactNode;delay?:number}) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={reducedMotion ? false : {opacity:0,y:24}}
      whileInView={{opacity:1,y:0,rotateX:0}}
      viewport={{once:true,amount:.16}}
      transition={{duration:reducedMotion ? 0 : .4,delay:reducedMotion ? 0 : delay,ease:[.22,1,.36,1]}}
    >
      {children}
    </motion.div>
  )
}

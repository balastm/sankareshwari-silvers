'use client'
import {motion} from 'motion/react'
export default function AdminMotion({children}:{children:React.ReactNode}){
 return <motion.div initial={{opacity:0,x:22,rotateY:-2}} animate={{opacity:1,x:0,rotateY:0}} exit={{opacity:0,x:-22,rotateY:2}} transition={{duration:.26,ease:[.22,1,.36,1]}}>{children}</motion.div>
}

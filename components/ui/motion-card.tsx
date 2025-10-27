"use client"

import { motion } from 'framer-motion'
import { Card } from './card'

interface MotionCardProps {
  delay?: number
  duration?: number
  initial?: any
  animate?: any
  whileHover?: any
  whileTap?: any
  children?: React.ReactNode
  className?: string
  [key: string]: any
}

export function MotionCard({
  delay = 0,
  duration = 0.5,
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  whileHover = { y: -4, transition: { duration: 0.2 } },
  whileTap = { scale: 0.98 },
  children,
  className,
  ...props
}: MotionCardProps) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={{ duration, delay }}
      whileHover={whileHover}
      whileTap={whileTap}
    >
      <Card className={className} {...props}>
        {children}
      </Card>
    </motion.div>
  )
}
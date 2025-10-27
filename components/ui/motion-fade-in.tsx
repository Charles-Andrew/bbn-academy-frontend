"use client"

import { motion, MotionProps } from 'framer-motion'
import { ReactNode, Children } from 'react'
import * as React from 'react'

interface MotionFadeInProps extends MotionProps {
  children: ReactNode
  delay?: number
  duration?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  distance?: number
  className?: string
}

const getInitialPosition = (direction: string, distance: number) => {
  switch (direction) {
    case 'up':
      return { opacity: 0, y: distance }
    case 'down':
      return { opacity: 0, y: -distance }
    case 'left':
      return { opacity: 0, x: distance }
    case 'right':
      return { opacity: 0, x: -distance }
    case 'none':
    default:
      return { opacity: 0 }
  }
}

const getAnimatePosition = (direction: string) => {
  switch (direction) {
    case 'up':
    case 'down':
      return { opacity: 1, y: 0 }
    case 'left':
    case 'right':
      return { opacity: 1, x: 0 }
    case 'none':
    default:
      return { opacity: 1 }
  }
}

export function MotionFadeIn({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  distance = 20,
  className,
  ...props
}: MotionFadeInProps) {
  return (
    <motion.div
      initial={getInitialPosition(direction, distance)}
      animate={getAnimatePosition(direction)}
      transition={{ duration, ease: 'easeOut', delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function MotionStaggerChildren({
  children,
  staggerDelay = 0.1,
  childDelay = 0,
  className,
}: {
  children: ReactNode
  staggerDelay?: number
  childDelay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className={className}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
        hidden: {},
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.6,
                ease: 'easeOut',
                delay: childDelay + index * staggerDelay
              }
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
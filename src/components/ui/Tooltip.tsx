import React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
  text: string
  className?: string
  position?: 'left' | 'center' | 'right'
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  text,
  className,
  position = 'center',
}) => {
  const positionClasses = {
    left: 'left-0 translate-x-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0 translate-x-0',
  }

  return (
    <div className="group">
      {children}
      <div
        className={cn(
          `absolute mt-2 px-3 py-2 rounded text-xs text-white bg-gray-900 whitespace-normal break-words text-wrap
           opacity-0 group-hover:opacity-100 z-10 pointer-events-none shadow-lg max-w-[400px]`,
          positionClasses[position],
          className,
        )}
        role="tooltip"
      >
        {text}
      </div>
    </div>
  )
}

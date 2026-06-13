'use client'

import { useState, useEffect, useRef } from 'react'
import { HelpCircle } from 'lucide-react'

interface Props {
  definition: string
  period?: string  // "YYYY/MM/DD〜YYYY/MM/DD" 形式
}

export function InfoTooltip({ definition, period }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="説明を表示"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg border border-border bg-popover shadow-md text-popover-foreground text-xs p-3 space-y-2">
          {/* 吹き出しの三角 */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-[-1px] border-4 border-transparent border-t-popover" />

          <div>
            <p className="font-semibold text-foreground mb-0.5">定義</p>
            <p className="text-muted-foreground leading-relaxed">{definition}</p>
          </div>

          {period && (
            <div className="border-t border-border pt-2">
              <p className="font-semibold text-foreground mb-0.5">データ期間</p>
              <p className="text-muted-foreground">{period}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

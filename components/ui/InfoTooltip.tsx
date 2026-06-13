'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle } from 'lucide-react'

interface Props {
  definition: string
  period?: string
}

export function InfoTooltip({ definition, period }: Props) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        tooltipRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      })
    }
    setOpen(v => !v)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="説明を表示"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>

      {mounted && open && createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
          }}
          className="w-64 rounded-lg border border-border bg-popover shadow-md text-popover-foreground text-xs p-3 space-y-2"
        >
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
        </div>,
        document.body
      )}
    </>
  )
}

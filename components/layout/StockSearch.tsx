'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

interface StockItem {
  code: string
  name: string
}

export function StockSearch() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<StockItem[]>([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [open, setOpen]       = useState(false)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const search = useCallback(async (q: string) => {
    if (!q) { setResults([]); setOpen(false); return }
    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}`)
      const data: StockItem[] = await res.json()
      setResults(data)
      setOpen(data.length > 0)
      setActiveIdx(-1)
    } catch {
      // ネットワークエラー時は無視
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 180)
  }

  const navigate = (code: string) => {
    router.push(`/stock/${code}`)
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0) {
        navigate(results[activeIdx].code)
      } else if (results.length === 1) {
        navigate(results[0].code)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const clear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapperRef} className="relative w-56 lg:w-64">
      {/* 入力欄 */}
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 focus-within:border-emerald-400 focus-within:bg-background transition-colors">
        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="銘柄名・コードで検索"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0"
          autoComplete="off"
        />
        {query && (
          <button type="button" onClick={clear} className="shrink-0">
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      {/* ドロップダウン */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-background shadow-lg z-50 overflow-hidden">
          {results.map((item, i) => (
            <button
              key={item.code}
              type="button"
              onClick={() => navigate(item.code)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                i === activeIdx
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-foreground hover:bg-muted/50'
              }`}
            >
              <span className="font-mono text-xs font-semibold text-muted-foreground w-9 shrink-0 tabular-nums">
                {item.code}
              </span>
              <span className="truncate">{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

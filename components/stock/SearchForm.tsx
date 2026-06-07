'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SearchForm() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim()
    if (!/^\d{4}$/.test(trimmed)) {
      setError('4桁の銘柄コードを入力してください（例：7203）')
      return
    }
    setError('')
    router.push(`/stock/${trimmed}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
      <div className="flex w-full max-w-md gap-2">
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value); setError('') }}
          placeholder="銘柄コード（例：7203）"
          maxLength={4}
          className="flex-1 h-12 px-4 text-lg border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
          inputMode="numeric"
          pattern="\d{4}"
        />
        <Button type="submit" size="lg" className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Search className="h-5 w-5 mr-1" />
          分析
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  )
}

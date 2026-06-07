'use client'

import { useState } from 'react'
import type { ScreenerCondition, ScreenerResult } from '@/types/analysis'
import { ScreenerForm } from '@/components/screener/ScreenerForm'
import { ScreenerResults } from '@/components/screener/ScreenerResults'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search } from 'lucide-react'

export default function ScreenerPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ScreenerResult[] | null>(null)
  const [message, setMessage] = useState<string | undefined>()

  const handleSearch = async (conditions: ScreenerCondition) => {
    setLoading(true)
    setMessage(undefined)
    try {
      const res = await fetch('/api/screener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conditions),
      })
      const data = await res.json()
      setResults(data.results ?? [])
      if (data.message) setMessage(data.message)
    } catch {
      setMessage('通信エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <Search className="h-5 w-5 text-emerald-500" />
          銘柄スクリーニング
        </h1>
        <p className="text-sm text-muted-foreground">
          条件を指定して、分析済み銘柄の中から候補をスコア順に表示します
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">絞り込み条件</CardTitle>
        </CardHeader>
        <CardContent>
          <ScreenerForm onSearch={handleSearch} loading={loading} />
        </CardContent>
      </Card>

      {results !== null && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              検索結果 {results.length > 0 && <span className="text-muted-foreground font-normal">（{results.length}件）</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScreenerResults results={results} message={message} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

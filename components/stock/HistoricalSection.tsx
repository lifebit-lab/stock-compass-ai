'use client'

import { useState } from 'react'
import { BarChart2, Table2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HistoricalTable } from './HistoricalTable'
import { HistoricalChart } from './HistoricalChart'
import type { HistoricalFinancialYear } from '@/types/stock'

interface Props {
  data: HistoricalFinancialYear[]
}

export function HistoricalSection({ data }: Props) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  if (!data || data.length === 0) return null

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-emerald-500" />
            業績推移（直近10年）
          </CardTitle>
          <div className="flex items-center gap-3">
            {view === 'table' && (
              <span className="text-xs text-muted-foreground">金額単位: 億円</span>
            )}
            <div className="flex rounded border border-border text-xs overflow-hidden">
              <button
                onClick={() => setView('chart')}
                className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
                  view === 'chart'
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <BarChart2 className="h-3 w-3" />
                グラフ
              </button>
              <button
                onClick={() => setView('table')}
                className={`flex items-center gap-1 px-2.5 py-1 border-l border-border transition-colors ${
                  view === 'table'
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Table2 className="h-3 w-3" />
                テーブル
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className={view === 'table' ? 'p-0 pb-4' : 'pt-0 pb-4 px-4'}>
        {view === 'chart' ? (
          <HistoricalChart data={data} />
        ) : (
          <HistoricalTable data={data} />
        )}
      </CardContent>
    </Card>
  )
}

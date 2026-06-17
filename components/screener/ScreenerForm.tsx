'use client'

import { useState } from 'react'
import type { ScreenerCondition } from '@/types/analysis'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

interface Props {
  onSearch: (conditions: ScreenerCondition) => void
  loading: boolean
}

function RangeInput({ label, min, max, step, unit, value, onChange }: {
  label: string
  min: number
  max: number
  step: number
  unit: string
  value: { min?: number }
  onChange: (v: { min?: number }) => void
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="number"
          placeholder={`${min}以上`}
          min={min}
          max={max}
          step={step}
          value={value.min ?? ''}
          onChange={e => onChange({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
          className="w-28 h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <span className="text-sm text-muted-foreground">{unit}以上</span>
      </div>
    </div>
  )
}

export function ScreenerForm({ onSearch, loading }: Props) {
  const [conditions, setConditions] = useState<ScreenerCondition>({})

  const update = (key: keyof ScreenerCondition, value: { min?: number; max?: number }) => {
    setConditions(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <RangeInput label="ROE" min={0} max={50} step={1} unit="%" value={conditions.roe ?? {}} onChange={v => update('roe', v)} />
        <RangeInput label="自己資本比率" min={0} max={100} step={5} unit="%" value={conditions.equityRatio ?? {}} onChange={v => update('equityRatio', v)} />
        <RangeInput label="配当利回り" min={0} max={10} step={0.5} unit="%" value={conditions.dividendYield ?? {}} onChange={v => update('dividendYield', v)} />
        <RangeInput label="売上成長率" min={-20} max={50} step={1} unit="%" value={conditions.revenueGrowthRate ?? {}} onChange={v => update('revenueGrowthRate', v)} />
        <RangeInput label="営業利益率" min={0} max={50} step={1} unit="%" value={conditions.operatingMargin ?? {}} onChange={v => update('operatingMargin', v)} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* PER上限 */}
        <div>
          <label className="text-sm font-medium">PER上限</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              placeholder="例: 20"
              min={0}
              max={100}
              step={1}
              value={conditions.per?.max ?? ''}
              onChange={e => update('per', { max: e.target.value === '' ? undefined : Number(e.target.value) })}
              className="w-28 h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-sm text-muted-foreground">倍以下</span>
          </div>
        </div>
        {/* PBR上限 */}
        <div>
          <label className="text-sm font-medium">PBR上限</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              placeholder="例: 2"
              min={0}
              max={10}
              step={0.1}
              value={conditions.pbr?.max ?? ''}
              onChange={e => update('pbr', { max: e.target.value === '' ? undefined : Number(e.target.value) })}
              className="w-28 h-9 px-3 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-sm text-muted-foreground">倍以下</span>
          </div>
        </div>
      </div>

      <Button
        onClick={() => onSearch(conditions)}
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        <Search className="h-4 w-4 mr-2" />
        {loading ? '検索中...' : 'スクリーニング実行'}
      </Button>
    </div>
  )
}

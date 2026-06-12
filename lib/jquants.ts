import type { StockPrice, CompanyInfo } from '@/types/stock'

const BASE_URL = 'https://api.jquants.com/v2'

function apiKey(): string {
  const key = process.env.JQUANTS_API_KEY
  if (!key) throw new Error('JQUANTS_API_KEY is not set')
  return key
}

async function jquantsGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: { 'x-api-key': apiKey() },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`J-Quants API error: ${res.status} ${path} ${body}`)
  }

  return res.json()
}

// 株価履歴を取得（直近300日）
export async function getStockPrices(code: string): Promise<StockPrice[]> {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 300)

  const fmt = (d: Date) => d.toISOString().split('T')[0]

  // V2 フィールド名は短縮形(d/O/H/L/C/Vo/AC)またはフル形(Date/Open/High/Low/Close/Volume/AdjustmentClose)
  const data = await jquantsGet<{ data: Array<Record<string, string | number>> }>(
    '/equities/bars/daily',
    { code, from: fmt(from) }
  )

  return (data.data ?? [])
    .map(q => {
      const date = String(q.d ?? q.Date ?? q.date ?? '')
      const close = Number(q.C ?? q.Close ?? q.close ?? 0)
      const open = Number(q.O ?? q.Open ?? q.open ?? 0)
      const high = Number(q.H ?? q.High ?? q.high ?? 0)
      const low = Number(q.L ?? q.Low ?? q.low ?? 0)
      const volume = Number(q.Vo ?? q.Volume ?? q.volume ?? 0)
      const adjustedClose = Number(q.AdjC ?? q.AC ?? q.AdjustmentClose ?? q.AdjClose ?? close)
      return { date, open, high, low, close, volume, adjustedClose }
    })
    .filter(p => p.date !== '' && p.close > 0)
}

// 企業情報を取得
export async function getCompanyInfo(code: string): Promise<CompanyInfo | null> {
  const data = await jquantsGet<{ data: Array<{
    Code: string
    CoName: string
    S17Nm: string
    MktNm: string
  }> }>('/equities/master', { code })

  const info = data.data?.[0]
  if (!info) return null

  return {
    code: info.Code,
    name: info.CoName,
    sector: info.S17Nm,
    marketCapitalization: 0, // V2 /equities/master では提供なし
    exchange: info.MktNm,
  }
}

// 日経平均の直近データ取得（下落理由判定用）
export async function getNikkeiPrices(): Promise<StockPrice[]> {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const data = await jquantsGet<{ data: Array<Record<string, string | number>> }>(
    '/indices/bars/daily',
    { index_code: '0028', from: fmt(from) }
  ).catch(() => ({ data: [] as Array<Record<string, string | number>> }))

  return (data.data ?? []).map(q => ({
    date: String(q.d ?? q.Date ?? q.date ?? ''),
    open: Number(q.O ?? q.Open ?? q.open ?? 0),
    high: Number(q.H ?? q.High ?? q.high ?? 0),
    low: Number(q.L ?? q.Low ?? q.low ?? 0),
    close: Number(q.C ?? q.Close ?? q.close ?? 0),
    volume: Number(q.Vo ?? q.Volume ?? q.volume ?? 0),
  })).filter(p => p.date !== '' && p.close > 0)
}

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

  const data = await jquantsGet<{ data: Array<{
    d: string   // date
    O: number   // open
    H: number   // high
    L: number   // low
    C: number   // close
    Vo: number  // volume
    AC: number  // adjusted close
  }> }>('/equities/bars/daily', {
    code,
    from: fmt(from),
    // toは指定しない → プランの最新利用可能日まで自動返却
  })

  return (data.data ?? []).map(q => ({
    date: q.d,
    open: q.O,
    high: q.H,
    low: q.L,
    close: q.C,
    volume: q.Vo,
    adjustedClose: q.AC,
  }))
}

// 企業情報を取得
export async function getCompanyInfo(code: string): Promise<CompanyInfo | null> {
  const data = await jquantsGet<{ data: Array<{
    Code: string
    CompanyName: string
    Sector17CodeName: string
    MarketCapitalization: number
    MarketCode: string
  }> }>('/equities/master', { code })

  const info = data.data?.[0]
  if (!info) return null

  return {
    code: info.Code,
    name: info.CompanyName,
    sector: info.Sector17CodeName,
    marketCapitalization: info.MarketCapitalization,
    exchange: info.MarketCode,
  }
}

// 日経平均の直近データ取得（下落理由判定用）
export async function getNikkeiPrices(): Promise<StockPrice[]> {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  const data = await jquantsGet<{ data: Array<{
    d: string
    O: number
    H: number
    L: number
    C: number
    Vo: number
  }> }>('/indices/bars/daily', {
    index_code: '0028', // 日経平均株価
    from: fmt(from),
    // toは指定しない → プランの最新利用可能日まで自動返却
  }).catch(() => ({ data: [] }))

  return (data.data ?? []).map(q => ({
    date: q.d,
    open: q.O,
    high: q.H,
    low: q.L,
    close: q.C,
    volume: q.Vo ?? 0,
  }))
}

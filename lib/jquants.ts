import type { StockPrice, CompanyInfo } from '@/types/stock'

const BASE_URL = 'https://api.jquants.com/v1'

let cachedIdToken: string | null = null
let tokenExpiresAt: number = 0

async function getIdToken(): Promise<string> {
  if (cachedIdToken && Date.now() < tokenExpiresAt) {
    return cachedIdToken
  }

  // リフレッシュトークンからIDトークンを取得（ボディで送信）
  const res = await fetch(`${BASE_URL}/token/auth_refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: process.env.JQUANTS_REFRESH_TOKEN }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`J-Quants token refresh failed: ${res.status} ${body}`)
  }

  const data = await res.json()
  cachedIdToken = data.idToken
  // 24時間有効（余裕をみて23時間）
  tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000
  return cachedIdToken!
}

async function jquantsGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = await getIdToken()
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 }, // 1時間キャッシュ
  })

  if (!res.ok) {
    throw new Error(`J-Quants API error: ${res.status} ${path}`)
  }

  return res.json()
}

// 株価履歴を取得（直近200営業日）
export async function getStockPrices(code: string): Promise<StockPrice[]> {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 300) // 余裕を持って300日前から

  const data = await jquantsGet<{ daily_quotes: Array<{
    Date: string
    Open: number
    High: number
    Low: number
    Close: number
    Volume: number
    AdjustmentClose: number
  }> }>('/prices/daily_quotes', {
    code,
    from: from.toISOString().split('T')[0].replace(/-/g, ''),
    to: to.toISOString().split('T')[0].replace(/-/g, ''),
  })

  return (data.daily_quotes ?? []).map(q => ({
    date: q.Date,
    open: q.Open,
    high: q.High,
    low: q.Low,
    close: q.Close,
    volume: q.Volume,
    adjustedClose: q.AdjustmentClose,
  }))
}

// 企業情報を取得
export async function getCompanyInfo(code: string): Promise<CompanyInfo | null> {
  const data = await jquantsGet<{ info: Array<{
    Code: string
    CompanyName: string
    Sector17CodeName: string
    MarketCapitalization: number
    MarketCode: string
  }> }>('/listed/info', { code })

  const info = data.info?.[0]
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
  return getStockPrices('0000') // 日経225インデックスコード
}

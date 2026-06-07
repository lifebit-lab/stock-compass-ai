import { NextRequest, NextResponse } from 'next/server'
import type { ScreenerCondition, ScreenerResult } from '@/types/analysis'

// J-Quantsから上場銘柄一覧を取得してフィルタリング
async function getListedStocks(): Promise<Array<{ code: string; name: string; sector: string }>> {
  const refreshToken = process.env.JQUANTS_REFRESH_TOKEN
  if (!refreshToken) return []

  const tokenRes = await fetch(
    `https://api.jquants.com/v1/token/auth_refresh?refreshtoken=${refreshToken}`,
    { method: 'POST' }
  )
  if (!tokenRes.ok) return []
  const { idToken } = await tokenRes.json()

  const res = await fetch('https://api.jquants.com/v1/listed/info', {
    headers: { Authorization: `Bearer ${idToken}` },
    next: { revalidate: 86400 },
  })
  if (!res.ok) return []

  const data = await res.json()
  return (data.info ?? []).map((s: { Code: string; CompanyName: string; Sector17CodeName: string }) => ({
    code: s.Code,
    name: s.CompanyName,
    sector: s.Sector17CodeName,
  }))
}

export async function POST(req: NextRequest) {
  const conditions: ScreenerCondition = await req.json()

  // 全銘柄取得（キャッシュ活用）
  const stocks = await getListedStocks()

  // スクリーニング：財務データが必要なため、Supabaseのキャッシュを活用
  // キャッシュにある銘柄のみをフィルタリング対象とする（Phase 1の制限）
  const { createServiceClient } = await import('@/lib/supabase/server')
  const supabase = await createServiceClient()

  const { data: cachedAnalyses } = await supabase
    .from('analysis_cache')
    .select('stock_code, analysis_result, score, created_at')
    .order('created_at', { ascending: false })

  if (!cachedAnalyses || cachedAnalyses.length === 0) {
    return NextResponse.json({
      results: [],
      message: '分析済み銘柄がまだありません。先に銘柄を検索してキャッシュを蓄積してください。',
    })
  }

  // 銘柄ごとに最新のキャッシュのみを使用
  const latestByCode = new Map<string, typeof cachedAnalyses[number]>()
  for (const row of cachedAnalyses) {
    if (!latestByCode.has(row.stock_code)) {
      latestByCode.set(row.stock_code, row)
    }
  }

  const results: ScreenerResult[] = []

  for (const [code, row] of latestByCode) {
    const analysis = row.analysis_result as { financial: { roe: number; per: number; equityRatio: number; revenueGrowthRate: number; dividendYield: number; pbr: number; operatingMargin: number }; company: { name: string; sector: string } }
    const f = analysis?.financial
    if (!f) continue

    // 条件フィルタリング
    if (conditions.roe?.min !== undefined && f.roe < conditions.roe.min) continue
    if (conditions.roe?.max !== undefined && f.roe > conditions.roe.max) continue
    if (conditions.per?.min !== undefined && (f.per <= 0 || f.per < conditions.per.min)) continue
    if (conditions.per?.max !== undefined && (f.per <= 0 || f.per > conditions.per.max)) continue
    if (conditions.equityRatio?.min !== undefined && f.equityRatio < conditions.equityRatio.min) continue
    if (conditions.equityRatio?.max !== undefined && f.equityRatio > conditions.equityRatio.max) continue
    if (conditions.revenueGrowthRate?.min !== undefined && f.revenueGrowthRate < conditions.revenueGrowthRate.min) continue
    if (conditions.dividendYield?.min !== undefined && f.dividendYield < conditions.dividendYield.min) continue
    if (conditions.pbr?.min !== undefined && (f.pbr <= 0 || f.pbr < conditions.pbr.min)) continue
    if (conditions.pbr?.max !== undefined && (f.pbr <= 0 || f.pbr > conditions.pbr.max)) continue
    if (conditions.operatingMargin?.min !== undefined && f.operatingMargin < conditions.operatingMargin.min) continue

    const stockInfo = stocks.find(s => s.code === code)

    results.push({
      code,
      name: analysis.company?.name ?? stockInfo?.name ?? code,
      sector: analysis.company?.sector ?? stockInfo?.sector ?? '不明',
      score: row.score,
      roe: f.roe,
      per: f.per,
      equityRatio: f.equityRatio,
      dividendYield: f.dividendYield,
      revenueGrowthRate: f.revenueGrowthRate,
    })
  }

  // スコア降順でソート
  results.sort((a, b) => b.score - a.score)

  return NextResponse.json({ results: results.slice(0, 50) })
}

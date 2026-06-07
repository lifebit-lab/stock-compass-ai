import { NextRequest, NextResponse } from 'next/server'
import { getStockPrices, getCompanyInfo, getNikkeiPrices } from '@/lib/jquants'
import { getFinancialData } from '@/lib/edinet'
import { calcTechnicalIndicators } from '@/lib/utils/technical'
import { calcScore, calcInvestmentStyle } from '@/lib/utils/scoring'
import { analyzeDecline, checkExclusion } from '@/lib/utils/decline-rule'
import { createServiceClient } from '@/lib/supabase/server'
import type { StockAnalysis } from '@/types/analysis'

const CACHE_TTL_MS = 60 * 60 * 1000 // 1時間

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  if (!/^\d{4}$/.test(code)) {
    return NextResponse.json({ error: '銘柄コードは4桁の数字で入力してください' }, { status: 400 })
  }

  // Supabaseキャッシュを確認
  try {
    const supabase = await createServiceClient()
    const { data: cached } = await supabase
      .from('analysis_cache')
      .select('analysis_result, created_at')
      .eq('stock_code', code)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      const age = Date.now() - new Date(cached.created_at).getTime()
      if (age < CACHE_TTL_MS) {
        return NextResponse.json(cached.analysis_result, {
          headers: { 'X-Cache': 'HIT' },
        })
      }
    }
  } catch {
    // キャッシュ取得失敗は無視して続行
  }

  // データ取得
  const [stockPrices, companyInfo, financial, nikkeiPrices] = await Promise.all([
    getStockPrices(code),
    getCompanyInfo(code),
    getFinancialData(code),
    getNikkeiPrices(),
  ])

  if (!companyInfo) {
    return NextResponse.json({ error: '銘柄が見つかりませんでした' }, { status: 404 })
  }

  // 分析実行
  const technical = calcTechnicalIndicators(stockPrices)
  const score = calcScore(financial, technical)
  const decline = analyzeDecline(stockPrices, nikkeiPrices, financial)
  const exclusion = checkExclusion(financial)
  const investmentStyle = calcInvestmentStyle(financial, score)

  const analysis: StockAnalysis = {
    code,
    company: companyInfo,
    financial,
    technical,
    decline,
    exclusion,
    score,
    investmentStyle,
    analyzedAt: new Date().toISOString(),
  }

  // キャッシュ保存（エラーは無視）
  try {
    const supabase = await createServiceClient()
    await supabase.from('analysis_cache').insert({
      stock_code: code,
      analysis_result: analysis,
      score: score.total,
    })
  } catch {
    // キャッシュ保存失敗は無視
  }

  return NextResponse.json(analysis, {
    headers: { 'X-Cache': 'MISS' },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { getCompanyInfo } from '@/lib/jquants'
import { getFinancialFromJQuants } from '@/lib/edinet'
import { getBatchQuotes } from '@/lib/yahoo-finance'
import type { ScreenerCondition, ScreenerResult } from '@/types/analysis'

// 代表的な日本株銘柄コード（時価総額上位・各業種）
const PRESET_CODES = [
  '7203', '6758', '9984', '8306', '9432', // トヨタ・ソニー・SBG・三菱UFJ・NTT
  '6861', '7974', '4063', '9433', '8058', // キーエンス・任天堂・信越化学・KDDI・三菱商事
  '6367', '9022', '7751', '4502', '6954', // ダイキン・JR東海・キヤノン・武田・ファナック
  '8031', '9020', '7267', '4661', '6981', // 三井物産・JR東日本・ホンダ・OLC・村田製
  '8035', '4543', '2914', '9983', '6702', // 東京エレク・テルモ・JT・ファストリ・富士通
]

export async function POST(req: NextRequest) {
  const body = await req.json()
  const conditions: ScreenerCondition = body.conditions ?? body
  const customCodes: string[] = body.codes ?? PRESET_CODES
  const targets = customCodes.slice(0, 30)

  // J-Quantsで財務データ + 企業情報を並行取得（高速・API制限なし）
  const [analyses, quotes] = await Promise.all([
    Promise.allSettled(
      targets.map(async code => {
        const [company, financial] = await Promise.all([
          getCompanyInfo(code),
          getFinancialFromJQuants(code),
        ])
        return { code, company, financial }
      })
    ),
    // Yahoo Finance バッチで全銘柄のPER・PBR・配当利回りを1回で取得
    getBatchQuotes(targets),
  ])

  const results: ScreenerResult[] = []

  for (const result of analyses) {
    if (result.status !== 'fulfilled') continue
    const { code, company, financial: f } = result.value
    if (!company || !f) continue

    // Yahoo Financeの市場データをマージ
    const q = quotes.get(code) ?? { per: 0, pbr: 0, dividendYield: 0 }
    const per = q.per
    const pbr = q.pbr
    const dividendYield = q.dividendYield

    // 条件フィルタリング
    if (conditions.roe?.min !== undefined && f.roe < conditions.roe.min) continue
    if (conditions.roe?.max !== undefined && f.roe > conditions.roe.max) continue
    if (conditions.per?.min !== undefined && (per <= 0 || per < conditions.per.min)) continue
    if (conditions.per?.max !== undefined && (per <= 0 || per > conditions.per.max)) continue
    if (conditions.equityRatio?.min !== undefined && f.equityRatio < conditions.equityRatio.min) continue
    if (conditions.equityRatio?.max !== undefined && f.equityRatio > conditions.equityRatio.max) continue
    if (conditions.revenueGrowthRate?.min !== undefined && f.revenueGrowthRate < conditions.revenueGrowthRate.min) continue
    if (conditions.dividendYield?.min !== undefined && dividendYield < conditions.dividendYield.min) continue
    if (conditions.pbr?.min !== undefined && (pbr <= 0 || pbr < conditions.pbr.min)) continue
    if (conditions.pbr?.max !== undefined && (pbr <= 0 || pbr > conditions.pbr.max)) continue
    if (conditions.operatingMargin?.min !== undefined && f.operatingMargin < conditions.operatingMargin.min) continue

    // 簡易スコア計算（Yahoo Financeの市場データも活用）
    let score = 0
    if (f.roe >= 10) score += 20
    else if (f.roe >= 5) score += 10
    if (f.equityRatio >= 40) score += 20
    else if (f.equityRatio >= 20) score += 10
    if (f.revenueGrowthRate >= 5) score += 15
    else if (f.revenueGrowthRate >= 0) score += 5
    if (f.operatingCashFlow > 0) score += 15
    if (dividendYield >= 3) score += 15
    else if (dividendYield >= 1) score += 5
    if (per > 0 && per <= 15) score += 15

    results.push({
      code,
      name: company.name,
      sector: company.sector,
      score,
      roe: f.roe,
      per,
      pbr,
      equityRatio: f.equityRatio,
      dividendYield,
      revenueGrowthRate: f.revenueGrowthRate,
      operatingMargin: f.operatingMargin,
    })
  }

  results.sort((a, b) => b.score - a.score)

  return NextResponse.json({ results })
}

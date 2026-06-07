import { NextRequest, NextResponse } from 'next/server'
import { getCompanyInfo } from '@/lib/jquants'
import { getFinancialData } from '@/lib/edinet'
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

  // 最大30銘柄まで並行取得
  const targets = customCodes.slice(0, 30)

  const analyses = await Promise.allSettled(
    targets.map(async code => {
      const [company, financial] = await Promise.all([
        getCompanyInfo(code),
        getFinancialData(code),
      ])
      return { code, company, financial }
    })
  )

  const results: ScreenerResult[] = []

  for (const result of analyses) {
    if (result.status !== 'fulfilled') continue
    const { code, company, financial: f } = result.value
    if (!company || !f) continue

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

    // 簡易スコア計算
    let score = 0
    if (f.roe >= 10) score += 20
    else if (f.roe >= 5) score += 10
    if (f.equityRatio >= 40) score += 20
    else if (f.equityRatio >= 20) score += 10
    if (f.revenueGrowthRate >= 5) score += 15
    else if (f.revenueGrowthRate >= 0) score += 5
    if (f.operatingCashFlow > 0) score += 15
    if (f.dividendYield >= 3) score += 15
    else if (f.dividendYield >= 1) score += 5
    if (f.per > 0 && f.per <= 15) score += 15

    results.push({
      code,
      name: company.name,
      sector: company.sector,
      score,
      roe: f.roe,
      per: f.per,
      equityRatio: f.equityRatio,
      dividendYield: f.dividendYield,
      revenueGrowthRate: f.revenueGrowthRate,
    })
  }

  results.sort((a, b) => b.score - a.score)

  return NextResponse.json({ results })
}

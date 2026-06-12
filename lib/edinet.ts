import type { FinancialData } from '@/types/stock'

const BASE_URL = 'https://disclosure.edinet-fsa.go.jp/api/v2'

interface EdinetDocumentListItem {
  docID: string
  edinetCode: string
  filerName: string
  docTypeCode: string
  periodEnd: string
  submitDateTime: string
}

// EDINET書類一覧から最新の有価証券報告書を検索
async function getLatestAnnualReport(edinetCode: string): Promise<EdinetDocumentListItem | null> {
  const today = new Date()
  const results: EdinetDocumentListItem[] = []

  // 直近2年分を検索
  for (let i = 0; i < 730; i += 30) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const res = await fetch(
      `${BASE_URL}/documents.json?date=${dateStr}&type=2&Subscription-Key=${process.env.EDINET_API_KEY}`
    )
    if (!res.ok) continue

    const data = await res.json()
    const docs: EdinetDocumentListItem[] = data.results ?? []

    // 有価証券報告書（docTypeCode: '120'）を探す
    const annual = docs.find(
      d => d.edinetCode === edinetCode && d.docTypeCode === '120'
    )
    if (annual) {
      results.push(annual)
      if (results.length >= 3) break
    }
  }

  return results[0] ?? null
}

// EDINETコードを銘柄コードから取得（J-Quantsの企業情報を利用）
export async function getEdinetCode(stockCode: string): Promise<string | null> {
  // EDINETのコード検索API（企業名or証券コードで検索）
  const res = await fetch(
    `${BASE_URL}/companies.json?type=1&Subscription-Key=${process.env.EDINET_API_KEY}`
  )
  if (!res.ok) return null

  const data = await res.json()
  const company = (data.results ?? []).find(
    (c: { securitiesCode: string; edinetCode: string }) =>
      c.securitiesCode === stockCode.padStart(5, '0') + '0'
  )
  return company?.edinetCode ?? null
}

// 財務データを取得（モック値を含む安全なフォールバック付き）
export async function getFinancialData(stockCode: string): Promise<FinancialData> {
  // EDINET APIはXBRLの解析が必要なため、
  // Phase 1では財務APIから取得可能な主要指標のみを返す
  // 実際のEDINET XBRLパースはPhase 1.5以降で実装予定

  // J-Quants fins APIから財務情報を取得（より実用的）
  return getFinancialFromJQuants(stockCode)
}

async function getFinancialFromJQuants(code: string): Promise<FinancialData> {
  const apiKey = process.env.JQUANTS_API_KEY
  if (!apiKey) return getDefaultFinancialData()

  const res = await fetch(
    `https://api.jquants.com/v2/fins/summary?code=${code}`,
    {
      headers: { 'x-api-key': apiKey },
      next: { revalidate: 86400 },
    }
  )

  if (!res.ok) return getDefaultFinancialData()

  const data = await res.json()
  const statements: Array<Record<string, string | number>> = data.data ?? []

  if (statements.length === 0) return getDefaultFinancialData()

  const annual = statements.slice(0, 3)
  return parseStatements(annual)
}

function parseStatements(statements: Array<Record<string, string | number>>): FinancialData {
  const toNum = (v: string | number | undefined) => {
    if (v === undefined || v === null || v === '') return 0
    return typeof v === 'number' ? v : parseFloat(String(v)) || 0
  }

  const latest = statements[0] ?? {}
  const prev = statements[1] ?? {}
  const prev2 = statements[2] ?? {}

  // J-Quants V2 fins/summary フィールド名
  const netSales = toNum(latest.Sales)
  const netSalesPrev = toNum(prev.Sales)
  const netSalesPrev2 = toNum(prev2.Sales)

  const operatingProfit = toNum(latest.OP)
  const operatingProfitPrev = toNum(prev.OP)

  const netIncome = toNum(latest.NP)
  const netIncomePrev = toNum(prev.NP)
  const eps = toNum(latest.EPS)
  const epsPrev = toNum(prev.EPS)

  // EqAR は0〜1の小数（例: 0.38 = 38%）
  const equityRatio = toNum(latest.EqAR) * 100
  const equity = toNum(latest.Eq)
  const totalAssets = toNum(latest.TA)
  const operatingCashFlow = toNum(latest.CFO)

  const divPerShare = toNum(latest.DivAnn)
  // PayoutRatioAnn は小数値（例: 0.204 = 20.4%）→ ×100 でパーセントに変換
  const payoutRatio = toNum(latest.PayoutRatioAnn) * 100

  const revenueGrowthRate = netSalesPrev > 0
    ? ((netSales - netSalesPrev) / netSalesPrev) * 100
    : 0

  const operatingProfitGrowthRate = operatingProfitPrev > 0
    ? ((operatingProfit - operatingProfitPrev) / Math.abs(operatingProfitPrev)) * 100
    : 0

  const epsGrowthRate = epsPrev > 0
    ? ((eps - epsPrev) / Math.abs(epsPrev)) * 100
    : 0

  return {
    revenueGrowthRate,
    operatingProfitGrowthRate,
    epsGrowthRate,
    equityRatio,
    interestBearingDebt: 0, // V2 fins/summary では提供なし
    operatingCashFlow,
    roe: equity > 0 ? (netIncome / equity) * 100 : 0,
    roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
    operatingMargin: netSales > 0 ? (operatingProfit / netSales) * 100 : 0,
    dividendYield: 0,  // 株価が必要 → API側で算出
    payoutRatio,
    per: 0,            // EPS/株価が必要 → API側で算出
    pbr: 0,            // BPS/株価が必要 → API側で算出
    revenue: [netSales, netSalesPrev, netSalesPrev2],
    operatingProfit: [operatingProfit, operatingProfitPrev, toNum(prev2.OP)],
    dividendHistory: [divPerShare, toNum(prev.DivAnn), toNum(prev2.DivAnn)],
    // 計算用中間値
    eps,
    bps: toNum(latest.BPS),
    divPerShare,
  }
}

function getDefaultFinancialData(): FinancialData {
  return {
    revenueGrowthRate: 0,
    operatingProfitGrowthRate: 0,
    epsGrowthRate: 0,
    equityRatio: 0,
    interestBearingDebt: 0,
    operatingCashFlow: 0,
    roe: 0,
    roa: 0,
    operatingMargin: 0,
    dividendYield: 0,
    payoutRatio: 0,
    per: 0,
    pbr: 0,
    revenue: [0, 0, 0],
    operatingProfit: [0, 0, 0],
    dividendHistory: [0, 0, 0],
  }
}


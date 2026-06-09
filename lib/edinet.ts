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

  const netSales = toNum(latest.NetSales)
  const netSalesPrev = toNum(prev.NetSales)
  const netSalesPrev2 = toNum(prev2.NetSales)

  const operatingProfit = toNum(latest.OperatingProfit)
  const operatingProfitPrev = toNum(prev.OperatingProfit)

  const equity = toNum(latest.Equity)
  const totalAssets = toNum(latest.TotalAssets)
  const netIncome = toNum(latest.NetIncome)
  const netIncomePrev = toNum(prev.NetIncome)

  const revenueGrowthRate = netSalesPrev > 0
    ? ((netSales - netSalesPrev) / netSalesPrev) * 100
    : 0

  const operatingProfitGrowthRate = operatingProfitPrev > 0
    ? ((operatingProfit - operatingProfitPrev) / Math.abs(operatingProfitPrev)) * 100
    : 0

  const epsGrowthRate = netIncomePrev > 0
    ? ((netIncome - netIncomePrev) / Math.abs(netIncomePrev)) * 100
    : 0

  return {
    revenueGrowthRate,
    operatingProfitGrowthRate,
    epsGrowthRate,
    equityRatio: totalAssets > 0 ? (equity / totalAssets) * 100 : 0,
    interestBearingDebt: toNum(latest.InterestBearingDebt),
    operatingCashFlow: toNum(latest.CashFlowsFromOperatingActivities),
    roe: equity > 0 ? (netIncome / equity) * 100 : 0,
    roa: totalAssets > 0 ? (netIncome / totalAssets) * 100 : 0,
    operatingMargin: netSales > 0 ? (operatingProfit / netSales) * 100 : 0,
    dividendYield: toNum(latest.DividendYield),
    payoutRatio: netIncome > 0
      ? (toNum(latest.DividendsPerShare) / (netIncome / Math.max(toNum(latest.NumberOfIssuedAndOutstandingSharesAtTheEndOfFiscalYearIncludingTreasuryStock), 1))) * 100
      : 0,
    per: toNum(latest.PriceEarningsRatio),
    pbr: toNum(latest.PriceBookValueRatio),
    revenue: [netSales, netSalesPrev, netSalesPrev2],
    operatingProfit: [operatingProfit, operatingProfitPrev, toNum(prev2.OperatingProfit)],
    dividendHistory: [
      toNum(latest.DividendsPerShare),
      toNum(prev.DividendsPerShare),
      toNum(prev2.DividendsPerShare),
    ],
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


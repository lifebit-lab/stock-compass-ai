import type { FinancialData } from '@/types/stock'

function n(v: unknown): number {
  return typeof v === 'number' ? v : 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getYF(): Promise<any> {
  const mod = await import('yahoo-finance2')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const YF = mod.default as any
  return new YF({ suppressNotices: ['yahooSurvey'] })
}

export async function getFinancialFromYahoo(stockCode: string): Promise<FinancialData | null> {
  const ticker = `${stockCode}.T`
  const period1 = '2021-01-01'

  try {
    const yf = await getYF()

    const [fins, bals, cfs, sum] = await Promise.all([
      yf.fundamentalsTimeSeries(ticker, { type: 'annual', module: 'financials', period1 }) as Promise<AnyRecord[]>,
      yf.fundamentalsTimeSeries(ticker, { type: 'annual', module: 'balance-sheet', period1 }) as Promise<AnyRecord[]>,
      yf.fundamentalsTimeSeries(ticker, { type: 'annual', module: 'cash-flow', period1 }) as Promise<AnyRecord[]>,
      yf.quoteSummary(ticker, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] }) as Promise<AnyRecord>,
    ])

    const desc = (arr: AnyRecord[]) =>
      [...arr].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const f = desc(fins), b = desc(bals), c = desc(cfs)

    if (f.length < 2) return null

    const [f0, f1, f2] = f
    const b0: AnyRecord = b[0] ?? {}
    const c0: AnyRecord = c[0] ?? {}
    const fd: AnyRecord = sum.financialData ?? {}
    const ks: AnyRecord = sum.defaultKeyStatistics ?? {}
    const sd: AnyRecord = sum.summaryDetail ?? {}

    const revenue = n(f0.totalRevenue)
    const revPrev = n(f1.totalRevenue)
    const revPrev2 = n(f2?.totalRevenue)
    const op = n(f0.operatingIncome)
    const opPrev = n(f1.operatingIncome)
    const netIncome = n(f0.netIncome)
    const eps = n(f0.dilutedEPS)
    const epsPrev = n(f1.dilutedEPS)
    const assets = n(b0.totalAssets)
    const equity = n(b0.commonStockEquity)
    const cfo = n(c0.operatingCashFlow)
    const divRate = n(sd.dividendRate)

    const revGrowth = revPrev > 0 ? ((revenue - revPrev) / revPrev) * 100 : 0
    const opGrowth = opPrev !== 0 ? ((op - opPrev) / Math.abs(opPrev)) * 100 : 0
    const epsGrowth = epsPrev !== 0 ? ((eps - epsPrev) / Math.abs(epsPrev)) * 100 : 0
    const payoutRatio = eps > 0 && divRate > 0 ? (divRate / eps) * 100 : 0

    // 期間: 前期末日+1日 〜 当期末日
    const endDate = new Date(f0.date)
    const prevEnd = new Date(f1.date)
    prevEnd.setDate(prevEnd.getDate() + 1)
    const period = {
      start: prevEnd.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    }

    return {
      revenueGrowthRate: revGrowth,
      operatingProfitGrowthRate: opGrowth,
      epsGrowthRate: epsGrowth,
      equityRatio: assets > 0 ? (equity / assets) * 100 : 0,
      interestBearingDebt: n(b0.totalDebt),
      operatingCashFlow: cfo,
      roe: fd.returnOnEquity ? n(fd.returnOnEquity) * 100 : (equity > 0 ? (netIncome / equity) * 100 : 0),
      roa: fd.returnOnAssets ? n(fd.returnOnAssets) * 100 : (assets > 0 ? (netIncome / assets) * 100 : 0),
      operatingMargin: fd.operatingMargins
        ? n(fd.operatingMargins) * 100
        : revenue > 0 ? (op / revenue) * 100 : 0,
      dividendYield: 0,   // API側で株価から算出
      payoutRatio,
      per: 0,             // API側で株価から算出
      pbr: 0,             // API側で株価から算出
      revenue: [revenue, revPrev, revPrev2],
      operatingProfit: [op, opPrev, n(f2?.operatingIncome)],
      dividendHistory: [divRate, 0, 0],
      eps,
      bps: n(ks.bookValue),
      divPerShare: divRate,
      period,
    }
  } catch (e) {
    console.error('[yahoo-finance] Error for', stockCode, ':', e)
    return null
  }
}

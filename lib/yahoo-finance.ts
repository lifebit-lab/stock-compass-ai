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

    const f = desc(fins)
    const b = desc(bals)
    const c = desc(cfs)

    if (f.length < 1) return null

    // フィールドが undefined の年があるため、各指標ごとに有効なレコードを選ぶ
    const withRev = f.filter(r => typeof r.totalRevenue === 'number' && r.totalRevenue > 0)
    const withOp  = f.filter(r => typeof r.operatingIncome === 'number')
    const withEps = f.filter(r => typeof r.dilutedEPS === 'number')

    const revenue   = n(withRev[0]?.totalRevenue)
    const revPrev   = n(withRev[1]?.totalRevenue)
    const revPrev2  = n(withRev[2]?.totalRevenue)
    const op        = n(withOp[0]?.operatingIncome)
    const opPrev    = n(withOp[1]?.operatingIncome)
    const netIncome = n(withOp[0]?.netIncome ?? f[0]?.netIncome)
    const eps       = n(withEps[0]?.dilutedEPS)
    const epsPrev   = n(withEps[1]?.dilutedEPS)

    const b0: AnyRecord = b[0] ?? {}
    const c0: AnyRecord = c[0] ?? {}
    const fd: AnyRecord = sum.financialData ?? {}
    const ks: AnyRecord = sum.defaultKeyStatistics ?? {}
    const sd: AnyRecord = sum.summaryDetail ?? {}

    const assets = n(b0.totalAssets)
    const equity = n(b0.commonStockEquity)
    const cfo    = n(c0.operatingCashFlow)
    const divRate = n(sd.dividendRate)

    const revGrowth = revPrev > 0 ? ((revenue - revPrev) / revPrev) * 100 : 0
    const opGrowth  = opPrev !== 0 ? ((op - opPrev) / Math.abs(opPrev)) * 100 : 0
    const epsGrowth = epsPrev !== 0 ? ((eps - epsPrev) / Math.abs(epsPrev)) * 100 : 0
    const payoutRatio = eps > 0 && divRate > 0 ? (divRate / eps) * 100 : 0

    // 期間: 有効な売上データの最新2件から算出（なければ最新FY）
    const endDateSrc  = withRev[0]?.date ?? f[0].date
    const prevDateSrc = withRev[1]?.date ?? f[1]?.date
    const endDate = new Date(endDateSrc)
    let period: { start: string; end: string } | undefined
    if (prevDateSrc) {
      const prevEnd = new Date(prevDateSrc)
      prevEnd.setDate(prevEnd.getDate() + 1)
      period = {
        start: prevEnd.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      }
    } else {
      period = {
        start: new Date(endDate.getFullYear() - 1, endDate.getMonth(), endDate.getDate() + 1).toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      }
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
      operatingProfit: [op, opPrev, n(withOp[2]?.operatingIncome)],
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

/** 過去の業績推移データを取得（Yahoo Financeの日本株は period1 に関わらず最大5件・4年分前後しか返さない） */
export async function getHistoricalFinancials(
  stockCode: string
): Promise<import('@/types/stock').HistoricalFinancialYear[]> {
  const ticker = `${stockCode}.T`
  const period1 = '2013-01-01'

  try {
    const yf = await getYF()
    const fins = await yf.fundamentalsTimeSeries(ticker, {
      type: 'annual',
      module: 'financials',
      period1,
    }) as AnyRecord[]

    const sorted = [...fins].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return sorted
      .filter((r: AnyRecord) => typeof r.totalRevenue === 'number' && r.totalRevenue > 0)
      .slice(0, 12)
      .map((r: AnyRecord) => {
        const endDate = new Date(r.date)
        const rev = r.totalRevenue as number
        const op  = typeof r.operatingIncome === 'number' ? r.operatingIncome : null
        const net = typeof r.netIncome === 'number' ? r.netIncome : null
        const eps = typeof r.dilutedEPS === 'number' ? r.dilutedEPS : null
        return {
          fiscalYearEnd: endDate.toISOString().split('T')[0],
          label: `${endDate.getFullYear()}/${endDate.getMonth() + 1}`,
          revenue: rev,
          operatingIncome: op,
          netIncome: net,
          eps,
          operatingMargin: op !== null ? (op / rev) * 100 : null,
        }
      })
  } catch (e) {
    console.error('[yahoo-finance] getHistoricalFinancials error:', e)
    return []
  }
}

export interface StockNewsItem {
  title: string
  publisher: string
  link: string
  publishedAt: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

/** 最新ニュースを取得（英語企業名でsearchして精度を上げる） */
export async function getStockNews(stockCode: string): Promise<StockNewsItem[]> {
  const { analyzeSentiment } = await import('./utils/sentiment')
  try {
    const yf = await getYF()
    const ticker = `${stockCode}.T`

    const sum = await yf.quoteSummary(ticker, { modules: ['price'] }) as AnyRecord
    const shortName: string = sum.price?.shortName ?? sum.price?.longName ?? ''
    if (!shortName) return []

    const result = await yf.search(shortName, { newsCount: 5 }) as AnyRecord
    const items: AnyRecord[] = result.news ?? []

    return items.map(item => ({
      title: String(item.title ?? ''),
      publisher: String(item.publisher ?? ''),
      link: String(item.link ?? ''),
      publishedAt: item.providerPublishTime
        ? new Date(item.providerPublishTime).toISOString()
        : new Date().toISOString(),
      sentiment: analyzeSentiment(String(item.title ?? '')),
    }))
  } catch {
    return []
  }
}

/** IR公式サイトURLを取得 */
export async function getIRWebsite(stockCode: string): Promise<string | undefined> {
  try {
    const yf = await getYF()
    const sum = await yf.quoteSummary(`${stockCode}.T`, {
      modules: ['summaryProfile'],
    }) as AnyRecord
    return sum.summaryProfile?.irWebsite ?? undefined
  } catch {
    return undefined
  }
}

/** スクリーナー用バッチ取得: 複数銘柄のPER・PBR・配当利回りを一括取得 */
export async function getBatchQuotes(
  stockCodes: string[]
): Promise<Map<string, { per: number; pbr: number; dividendYield: number }>> {
  const tickers = stockCodes.map(c => `${c}.T`)
  const result = new Map<string, { per: number; pbr: number; dividendYield: number }>()

  try {
    const yf = await getYF()
    const quotes: AnyRecord[] = await yf.quote(tickers)
    for (const q of quotes) {
      const code = String(q.symbol ?? '').replace('.T', '')
      if (!code) continue
      result.set(code, {
        per: n(q.trailingPE),
        pbr: n(q.priceToBook),
        dividendYield: n(q.dividendYield),
      })
    }
  } catch (e) {
    console.error('[yahoo-finance] getBatchQuotes error:', e)
  }

  return result
}

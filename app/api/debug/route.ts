import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.JQUANTS_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'JQUANTS_API_KEY not set' }, { status: 500 })

  const fromDate = '2026-01-01'

  const [masterRes, finsRes, barsRes] = await Promise.all([
    fetch('https://api.jquants.com/v2/equities/master?code=7203', {
      headers: { 'x-api-key': apiKey },
    }),
    fetch('https://api.jquants.com/v2/fins/summary?code=7203', {
      headers: { 'x-api-key': apiKey },
    }),
    fetch(`https://api.jquants.com/v2/equities/bars/daily?code=7203&from=${fromDate}`, {
      headers: { 'x-api-key': apiKey },
    }),
  ])

  const master = await masterRes.json().catch(() => ({ error: masterRes.status }))
  const fins = await finsRes.json().catch(() => ({ error: finsRes.status }))
  const bars = await barsRes.json().catch(() => ({ error: barsRes.status }))

  // fins/summary の全レコードから期間種別・売上を抽出して確認
  const finsAllRecords = (fins?.data ?? []).map((r: Record<string, unknown>) => ({
    keys: Object.keys(r),
    DocType: r.DocType,
    TypeOfDocument: r.TypeOfDocument,
    Period: r.Period,
    FiscalYear: r.FiscalYear,
    FiscalPeriodEnd: r.FiscalPeriodEnd,
    DisclosedDate: r.DisclosedDate,
    Sales: r.Sales,
    OP: r.OP,
    NP: r.NP,
    EPS: r.EPS,
  }))

  return NextResponse.json({
    master_status: masterRes.status,
    master_first: master?.data?.[0] ?? master,
    fins_status: finsRes.status,
    fins_all_count: fins?.data?.length ?? 0,
    fins_all_records: finsAllRecords,
    bars_status: barsRes.status,
    bars_first: bars?.data?.[0] ?? bars,
    bars_keys: bars?.data?.[0] ? Object.keys(bars.data[0]) : [],
  })
}

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

  return NextResponse.json({
    master_status: masterRes.status,
    master_first: master?.data?.[0] ?? master,
    fins_status: finsRes.status,
    fins_first: fins?.data?.[0] ?? fins,
    bars_status: barsRes.status,
    bars_first: bars?.data?.[0] ?? bars,  // 最初の1件でフィールド名確認
    bars_keys: bars?.data?.[0] ? Object.keys(bars.data[0]) : [],
  })
}

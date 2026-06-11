import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.JQUANTS_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'JQUANTS_API_KEY not set' }, { status: 500 })

  const [masterRes, finsRes] = await Promise.all([
    fetch('https://api.jquants.com/v2/equities/master?code=7203', {
      headers: { 'x-api-key': apiKey },
    }),
    fetch('https://api.jquants.com/v2/fins/summary?code=7203', {
      headers: { 'x-api-key': apiKey },
    }),
  ])

  const master = await masterRes.json().catch(() => ({ error: masterRes.status }))
  const fins = await finsRes.json().catch(() => ({ error: finsRes.status }))

  // フィールド名確認のため最初の1件だけ返す
  return NextResponse.json({
    master_status: masterRes.status,
    master_first: master?.data?.[0] ?? master,
    fins_status: finsRes.status,
    fins_first: fins?.data?.[0] ?? fins,
  })
}

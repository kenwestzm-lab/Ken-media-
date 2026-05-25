import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || 'africa'
  const CLIENT_ID = process.env.JAMENDO_CLIENT_ID || '542d63e5'

  try {
    const res = await fetch(
      `https://api.jamendo.com/v3.0/tracks/?client_id=${CLIENT_ID}&format=json&limit=20&search=${encodeURIComponent(query)}&audioformat=mp32&include=musicinfo`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    return NextResponse.json({ tracks: data.results || [] })
  } catch (err: any) {
    return NextResponse.json({ tracks: [], error: err.message })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || 'background'
  const KEY = process.env.PIXABAY_API_KEY || ''

  if (!KEY) {
    return NextResponse.json({
      error: 'Add PIXABAY_API_KEY to Vercel environment variables',
      tracks: [],
      setup: true
    })
  }

  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${KEY}&q=${encodeURIComponent(query)}&media_type=music&per_page=20&safesearch=true`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()

    // Format tracks to match our UI
    const tracks = (data.hits || []).map((hit: any) => ({
      id:          String(hit.id),
      name:        hit.tags?.split(',')[0]?.trim() || 'Track',
      artist_name: hit.user || 'Pixabay Artist',
      audio:       hit.downloads ? `https://cdn.pixabay.com/download/audio/${hit.id}/${hit.tags?.split(',')[0]?.trim()?.toLowerCase().replace(/\s/g,'-')}.mp3` : '',
      preview_url: hit.webformatURL || '',
      duration:    hit.duration || 120,
      pageURL:     hit.pageURL,
      tags:        hit.tags,
    }))

    return NextResponse.json({ tracks })
  } catch (err: any) {
    return NextResponse.json({ tracks: [], error: err.message })
  }
}

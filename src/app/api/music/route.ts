import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || 'background music'
  const KEY = process.env.FREESOUND_API_KEY || ''

  if (!KEY) {
    // Fallback: return curated royalty-free tracks with real working audio URLs
    const fallback = [
      { id: '1', name: 'Upbeat Corporate',     artist_name: 'Freesound',  audio: 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3', duration: 120 },
      { id: '2', name: 'Cinematic Background', artist_name: 'Freesound',  audio: 'https://cdn.freesound.org/previews/612/612092_5674468-lq.mp3', duration: 95  },
      { id: '3', name: 'Hip Hop Beat',         artist_name: 'Freesound',  audio: 'https://cdn.freesound.org/previews/588/588990_3797507-lq.mp3', duration: 110 },
      { id: '4', name: 'Afro Beats',           artist_name: 'Freesound',  audio: 'https://cdn.freesound.org/previews/612/612090_5674468-lq.mp3', duration: 130 },
      { id: '5', name: 'Motivational',         artist_name: 'Freesound',  audio: 'https://cdn.freesound.org/previews/561/561473_6399561-lq.mp3', duration: 88  },
    ]
    return NextResponse.json({ tracks: fallback, needsKey: true })
  }

  try {
    const res = await fetch(
      `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&token=${KEY}&fields=id,name,username,previews,duration&filter=duration:[10+TO+300]&page_size=15`,
      { signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    const tracks = (data.results || []).map((t: any) => ({
      id:          String(t.id),
      name:        t.name,
      artist_name: t.username,
      audio:       t.previews?.['preview-hq-mp3'] || t.previews?.['preview-lq-mp3'] || '',
      duration:    Math.round(t.duration),
    })).filter((t: any) => t.audio)

    return NextResponse.json({ tracks })
  } catch (err: any) {
    return NextResponse.json({ tracks: [], error: err.message })
  }
}

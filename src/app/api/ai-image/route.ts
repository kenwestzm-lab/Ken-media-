import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt, adminId } = await req.json()
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pollinations AI - completely FREE, no API key needed
    const encodedPrompt = encodeURIComponent(prompt + ', professional, high quality, 4k')
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`

    // Fetch the image
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error('Image generation failed')

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    return NextResponse.json({ image: `data:image/jpeg;base64,${base64}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

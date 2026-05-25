import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { prompt, adminId } = await req.json()
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const encodedPrompt = encodeURIComponent(
      prompt + ', professional photography, high quality, 4k, vibrant'
    )
    const seed = Math.floor(Math.random() * 999999)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}`

    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(45000),
    })

    if (!response.ok) throw new Error('Image generation failed')

    const buffer = await response.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    return NextResponse.json({ image: `data:image/jpeg;base64,${base64}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

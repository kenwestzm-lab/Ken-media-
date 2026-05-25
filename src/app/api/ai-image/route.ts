import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const { prompt, adminId } = await req.json()
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cleanPrompt = prompt.trim().replace(/[^\w\s,.-]/g, '')
    const seed = Math.floor(Math.random() * 999999)

    // Try multiple Pollinations models for reliability
    const urls = [
      `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt + ', professional, high quality, 4k, vibrant')}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`,
      `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt + ', professional design, high quality')}?width=1024&height=1024&nologo=true&seed=${seed + 1}`,
    ]

    let lastError = ''
    for (const url of urls) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(50000),
          headers: { 'Accept': 'image/*' },
        })
        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'image/jpeg'
          if (contentType.includes('image')) {
            const buffer = await response.arrayBuffer()
            if (buffer.byteLength > 1000) {
              const bytes = new Uint8Array(buffer)
              let binary = ''
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i])
              }
              const base64 = btoa(binary)
              return NextResponse.json({ image: `data:${contentType};base64,${base64}` })
            }
          }
        }
        lastError = `HTTP ${response.status}`
      } catch (e: any) {
        lastError = e.message
        continue
      }
    }

    return NextResponse.json({ error: `Generation failed: ${lastError}. Try a simpler description.` }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

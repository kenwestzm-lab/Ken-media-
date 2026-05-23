// src/app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server'

const TOOL_PROMPTS: Record<string, string> = {
  caption: 'You are a viral social media copywriter specializing in African businesses. Write an engaging, scroll-stopping social media caption. Use emojis strategically. Max 3 sentences. Include 3 relevant hashtags.',
  adcopy:  'You are an expert ad copywriter for African markets. Write a compelling Facebook/Instagram ad with a hook, value proposition, and clear CTA. Max 4 sentences.',
  slogan:  'You are a brand strategist for African businesses. Generate 5 short, memorable, catchy brand slogans. Each on a new line.',
  brand:   'You are a creative brand consultant. Provide a concise brand identity concept including: color palette, typography, brand personality, and tagline.',
  desc:    'You are a product description writer. Write an engaging, benefit-focused product description. 3-4 sentences.',
  script:  'You are a video ad scriptwriter. Write a 15-second social media video ad script with HOOK, VALUE, and CTA.',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tool, prompt, adminId } = body

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized — admin only' }, { status: 401 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    // Dynamically import OpenAI to avoid build-time issues
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const systemPrompt = TOOL_PROMPTS[tool] || TOOL_PROMPTS.caption
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context: ${prompt}\nGenerate content for Ken Media Creative Studio (Zambian creative agency).` },
      ],
      max_tokens: 500,
      temperature: 0.8,
    })

    const result = completion.choices[0]?.message?.content || ''
    return NextResponse.json({ result })
  } catch (err: any) {
    console.error('AI API error:', err)
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}

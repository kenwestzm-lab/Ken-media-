import { NextRequest, NextResponse } from 'next/server'

const TOOL_PROMPTS: Record<string, string> = {
  caption: 'You are a viral social media copywriter for African businesses. Write an engaging scroll-stopping caption with emojis. Max 3 sentences with 3 hashtags.',
  adcopy:  'You are an ad copywriter for African markets. Write a compelling Facebook/Instagram ad with hook, value, and CTA. Max 4 sentences.',
  slogan:  'Generate 5 short memorable brand slogans for an African creative studio. One per line.',
  brand:   'Give a brand identity concept: color palette, typography, personality, tagline.',
  desc:    'Write an engaging product description for a premium African design pack. 3-4 sentences.',
  script:  'Write a 15-second video ad script with HOOK, VALUE, CTA format.',
}

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { tool, prompt, adminId } = await req.json()
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const OPENAI_KEY = process.env.OPENAI_API_KEY
    if (!OPENAI_KEY) {
      // Fallback responses when no OpenAI key
      const fallbacks: Record<string, string> = {
        caption: "🔥 Your brand deserves to stand out! At Ken Media Creative Studio, we craft premium designs that stop the scroll and start conversations. Zambian excellence, global standard. 🇿🇲✨ #KenMedia #ZambiaDesign #CreativeStudio",
        adcopy: "Tired of blending in? Ken Media Creative Studio crafts premium logos, motion posters & branding that makes YOUR business unforgettable. Starting at K150. Message us today! 📲",
        slogan: "\"Design That Moves, Brands That Speak.\"\n\"Africa's Vision, Global Standard.\"\n\"Where Zambian Creativity Meets World-Class Design.\"\n\"Your Brand, Elevated.\"\n\"Built Different. Designed for Zambia.\"",
        brand: "Brand Concept:\n🎨 Colors: Royal Gold + Deep Black + Pure White\n✍️ Fonts: Geometric display + Modern sans-serif\n🏷 Personality: Bold, innovative, proudly African\n💡 Tagline: 'Built for Africa, Designed for the World'",
        desc: "Elevate your brand with our premium design pack — crafted with pixel-perfect precision for Zambian businesses ready to stand out. Includes editable templates, style guide, and print-ready files.",
        script: "HOOK (0-3s): Your brand is talking. Is it saying the right things?\nVALUE (4-12s): [Show 3 stunning before/after transformations]\nCTA (13-15s): Ken Media Creative Studio. DM us NOW! 🔥",
      }
      return NextResponse.json({ result: fallbacks[tool] || fallbacks.caption })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: TOOL_PROMPTS[tool] || TOOL_PROMPTS.caption },
          { role: 'user', content: `Context: ${prompt}\nCreate content for Ken Media Creative Studio, a Zambian creative agency.` },
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    })

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content || 'Generation failed'
    return NextResponse.json({ result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

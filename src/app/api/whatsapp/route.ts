import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json()
    const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || '0772799672'
    const CALLMEBOT_KEY = process.env.CALLMEBOT_API_KEY || ''

    if (!CALLMEBOT_KEY) {
      // Fallback: return WhatsApp deep link
      const link = `https://wa.me/260${WA_NUMBER.replace(/^0/, '')}?text=${encodeURIComponent(message)}`
      return NextResponse.json({ success: true, link })
    }

    const formattedPhone = `260${phone.replace(/^0/, '')}`
    const url = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodeURIComponent(message)}&apikey=${CALLMEBOT_KEY}`
    const res = await fetch(url)
    const text = await res.text()
    return NextResponse.json({ success: true, response: text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

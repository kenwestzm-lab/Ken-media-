'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Copy, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import { createPayment, updateOrderStatus } from '@/lib/firestore'
import { uploadToCloudinary } from '@/lib/cloudinary'
import useStore from '@/store/useStore'

const PAYMENT_METHODS = [
  { key: 'airtel_money',  icon: '📶', label: 'Airtel Money',  number: process.env.NEXT_PUBLIC_AIRTEL_NUMBER || '0570109056' },
  { key: 'mtn_money',    icon: '📡', label: 'MTN Money',     number: process.env.NEXT_PUBLIC_MTN_NUMBER   || '0761468402' },
  { key: 'bank_transfer', icon: '🏦', label: 'Access Bank',   number: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0136496126029' },
]

function CheckoutContent() {
  const { user } = useStore()
  const router = useRouter()
  const params = useSearchParams()
  const orderId = params.get('orderId') || 'KM-DEMO'
  const amount  = params.get('amount')  || '250'
  const service = params.get('service') || 'Design Service'

  const [step, setStep]         = useState<1|2|3>(1)
  const [method, setMethod]     = useState('airtel_money')
  const [proofFile, setProof]   = useState<File | null>(null)
  const [senderName, setSender] = useState('')
  const [senderNum, setSenderNum] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]  = useState(0)

  const selectedMethod = PAYMENT_METHODS.find(m => m.key === method) || PAYMENT_METHODS[0]

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num)
    toast.success('Copied!')
  }

  const handleSubmit = async () => {
    if (!proofFile)       { toast.error('Upload payment screenshot'); return }
    if (!senderName.trim()) { toast.error('Enter sender name'); return }
    if (!senderNum.trim())  { toast.error('Enter sender number'); return }
    setUploading(true)
    try {
      let proofUrl = 'pending'
      if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        const result = await uploadToCloudinary(proofFile, setProgress)
        proofUrl = result.url
      }
      await createPayment({
        orderId,
        userId:   user?.uid || 'guest',
        userName: senderName,
        amount:   parseInt(amount),
        method:   method as any,
        proofUrl,
        status:   'pending_review',
      })
      await updateOrderStatus(orderId, 'payment_reviewing')
      setStep(3)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
    padding: '12px 14px', color: '#F0EDE6', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    marginBottom: 12,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE6', paddingBottom: 80 }}>
      <Navbar />
      <div style={{ padding: '24px 16px 0' }}>
        <h1 style={{ fontFamily: 'serif', fontSize: 36, letterSpacing: 1, marginBottom: 4 }}>
          CHECK<span style={{ background: 'linear-gradient(135deg,#D4A017,#F5C842)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>OUT</span>
        </h1>
        <p style={{ fontSize: 13, color: '#888' }}>Complete your payment to unlock your order</p>
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', padding: '16px 16px 0' }}>
        {['Payment Method', 'Upload Proof', 'Done'].map((label, i) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginBottom: 4, background: i + 1 < step ? '#27AE60' : i + 1 === step ? 'linear-gradient(135deg,#D4A017,#F5C842)' : '#1a1a1a', border: i + 1 > step ? '1px solid rgba(255,255,255,0.1)' : 'none', color: i + 1 <= step ? '#000' : '#888' }}>
              {i + 1 < step ? '✓' : i + 1}
            </div>
            <p style={{ fontSize: 9, color: i + 1 === step ? '#D4A017' : '#555', textAlign: 'center' }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        {/* Order summary */}
        <div style={{ background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 16, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>ORDER</p>
            <p style={{ fontFamily: 'monospace', fontWeight: 700, color: '#D4A017' }}>{orderId}</p>
            <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{service}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>AMOUNT DUE</p>
            <p style={{ fontFamily: 'serif', fontSize: 28, color: '#D4A017', fontWeight: 900 }}>K{amount}</p>
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>1. Select Payment Method</h2>
            {PAYMENT_METHODS.map(m => (
              <div key={m.key} onClick={() => setMethod(m.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: method === m.key ? 'rgba(212,160,23,0.08)' : '#1a1a1a', border: `1px solid ${method === m.key ? 'rgba(212,160,23,0.5)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, marginBottom: 10, cursor: 'pointer' }}>
                <span style={{ fontSize: 24 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</p>
                  <p style={{ fontFamily: 'monospace', color: '#D4A017', fontSize: 14, marginTop: 2 }}>{m.number}</p>
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); copyNumber(m.number) }}
                  style={{ background: '#222', border: 'none', borderRadius: 8, padding: '6px 10px', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <Copy size={12} /> Copy
                </button>
                {method === m.key && <CheckCircle size={18} color="#D4A017" />}
              </div>
            ))}
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#D4A017', marginBottom: 8 }}>Instructions:</p>
              <ol style={{ fontSize: 12, color: '#888', paddingLeft: 16, lineHeight: 2 }}>
                <li>Open your {selectedMethod.label} app</li>
                <li>Send <strong style={{ color: '#fff' }}>K{amount}</strong> to <strong style={{ color: '#D4A017', fontFamily: 'monospace' }}>{selectedMethod.number}</strong></li>
                <li>Screenshot the confirmation</li>
                <li>Upload it on the next step</li>
              </ol>
            </div>
            <button onClick={() => setStep(2)} style={{ width: '100%', background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', border: 'none', borderRadius: 16, padding: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              I've Made the Payment →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>2. Upload Payment Proof</h2>
            <input value={senderName} onChange={e => setSender(e.target.value)} placeholder="Sender name on payment" style={inp} />
            <input value={senderNum} onChange={e => setSenderNum(e.target.value)} placeholder="Sender phone/account number" style={inp} />
            <label style={{ display: 'block', cursor: 'pointer', marginBottom: 16 }}>
              <div style={{ border: `2px dashed ${proofFile ? 'rgba(39,174,96,0.5)' : 'rgba(212,160,23,0.3)'}`, borderRadius: 16, padding: 28, textAlign: 'center', background: proofFile ? 'rgba(39,174,96,0.05)' : 'rgba(212,160,23,0.02)' }}>
                {proofFile ? (
                  <div>
                    <CheckCircle size={32} color="#27AE60" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 13, color: '#27AE60', fontWeight: 600 }}>{proofFile.name}</p>
                    <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{(proofFile.size/1024).toFixed(0)}KB · Tap to change</p>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} color="#D4A017" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 14, fontWeight: 600 }}>Tap to upload screenshot</p>
                    <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>JPG, PNG or PDF</p>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*,.pdf" onChange={e => setProof(e.target.files?.[0] || null)} style={{ display: 'none' }} />
            </label>
            {uploading && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ background: '#1a1a1a', borderRadius: 50, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#D4A017,#F5C842)', transition: 'width 0.2s', borderRadius: 50 }} />
                </div>
                <p style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 }}>{progress}%</p>
              </div>
            )}
            <div style={{ background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 12, color: '#D4A017' }}>
              🔒 Download unlocks automatically after admin approves your payment
            </div>
            <button onClick={handleSubmit} disabled={uploading}
              style={{ width: '100%', background: uploading ? '#1a1a1a' : 'linear-gradient(135deg,#D4A017,#F5C842)', color: uploading ? '#555' : '#000', border: 'none', borderRadius: 16, padding: 16, fontSize: 15, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {uploading ? <><span style={{ width: 18, height: 18, border: '2px solid #333', borderTop: '2px solid #D4A017', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Submitting...</> : 'Submit Payment Proof 🚀'}
            </button>
            <button onClick={() => setStep(1)} style={{ width: '100%', background: 'none', border: 'none', color: '#888', fontSize: 13, marginTop: 10, cursor: 'pointer', padding: 8 }}>
              ← Back
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', paddingTop: 20 }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontFamily: 'serif', fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Payment Submitted!</h2>
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, marginBottom: 24 }}>
              Our admin will verify and approve your payment within <strong style={{ color: '#D4A017' }}>1–4 hours</strong>. Your download will unlock automatically.
            </p>
            <div style={{ background: '#1a1a1a', borderRadius: 14, padding: 14, marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Order Reference</p>
              <p style={{ fontFamily: 'monospace', fontSize: 18, color: '#D4A017', fontWeight: 700 }}>{orderId}</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => router.push('/track')} style={{ flex: 1, background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', border: 'none', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Track Order</button>
              <button onClick={() => router.push('/dashboard')} style={{ flex: 1, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#F0EDE6', borderRadius: 14, padding: 14, fontSize: 14, cursor: 'pointer' }}>Dashboard</button>
            </div>
          </motion.div>
        )}
      </div>
      <BottomNav />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function CheckoutPage() {
  return <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4A017' }}>Loading...</div>}><CheckoutContent /></Suspense>
}

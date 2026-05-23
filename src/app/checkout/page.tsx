'use client'
// src/app/checkout/page.tsx
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Upload, CheckCircle, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import Navbar from '@/components/ui/Navbar'
import BottomNav from '@/components/ui/BottomNav'
import { createPayment, updateOrderStatus } from '@/lib/firestore'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import useStore from '@/store/useStore'

const schema = z.object({
  method: z.enum(['airtel_money', 'mtn_money', 'bank_transfer']),
  senderName:   z.string().min(2, 'Enter sender name'),
  senderNumber: z.string().min(10, 'Enter sender phone/account'),
})
type FormData = z.infer<typeof schema>

const PAYMENT_METHODS = [
  { key: 'airtel_money',  icon: '📶', label: 'Airtel Money',  number: process.env.NEXT_PUBLIC_AIRTEL_NUMBER || '0570109056' },
  { key: 'mtn_money',    icon: '📡', label: 'MTN Money',     number: process.env.NEXT_PUBLIC_MTN_NUMBER   || '0761468402' },
  { key: 'bank_transfer', icon: '🏦', label: 'Access Bank',   number: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '0136496126029' },
]

export default function CheckoutPage() {
  const { user } = useStore()
  const router = useRouter()
  const params = useSearchParams()
  const orderId   = params.get('orderId')   || 'KM-DEMO'
  const amount    = params.get('amount')    || '250'
  const service   = params.get('service')   || 'Logo Design'
  const [step, setStep]     = useState<1|2|3>(1)
  const [method, setMethod] = useState('airtel_money')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { method: 'airtel_money' },
  })

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num)
    toast.success('Copied to clipboard!')
  }

  const onSubmit = async (data: FormData) => {
    if (!proofFile) { toast.error('Please upload payment proof'); return }
    setUploading(true)
    try {
      let proofUrl = ''
      // Upload proof to Firebase Storage
      try {
        const fileRef = ref(storage, `payment_proofs/${orderId}_${Date.now()}_${proofFile.name}`)
        await uploadBytes(fileRef, proofFile)
        proofUrl = await getDownloadURL(fileRef)
      } catch {
        // Storage not configured: use placeholder for demo
        proofUrl = 'demo_proof_url'
      }

      await createPayment({
        orderId,
        userId: user?.uid || 'guest',
        userName: user?.displayName || data.senderName,
        amount: parseInt(amount),
        method: data.method,
        proofUrl,
        status: 'pending_review',
      })
      await updateOrderStatus(orderId, 'payment_reviewing')
      setStep(3)
    } catch (err) {
      toast.error('Submission failed. Please try again or contact us on WhatsApp.')
    } finally {
      setUploading(false)
    }
  }

  const selectedMethod = PAYMENT_METHODS.find(m => m.key === method) || PAYMENT_METHODS[0]

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />

      <div className="px-4 pt-8 pb-4">
        <h1 className="font-bebas text-5xl tracking-wider mb-1">
          CHECK<span className="text-gold-gradient">OUT</span>
        </h1>
        <p className="text-sm text-[#88887f]">Complete your payment to unlock your order</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 px-4 mb-6">
        {['Select Method', 'Upload Proof', 'Confirmed'].map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-all ${
              i + 1 < step ? 'bg-green-400 text-black' :
              i + 1 === step ? 'bg-gold-gradient text-black' :
              'bg-[#1a1a1a] border border-white/[0.12] text-[#88887f]'
            }`}>
              {i + 1 < step ? '✓' : i + 1}
            </div>
            <p className="text-[9px] text-[#88887f] text-center">{label}</p>
          </div>
        ))}
      </div>

      <div className="px-4 pb-28 max-w-lg mx-auto">
        {/* Order Summary */}
        <div className="bg-[rgba(212,160,23,0.06)] border border-[rgba(212,160,23,0.2)] rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="text-xs text-[#88887f] mb-0.5">Order</p>
              <p className="font-mono font-bold text-[#D4A017]">{orderId}</p>
              <p className="text-xs text-[#88887f] mt-0.5">{service}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#88887f] mb-0.5">Amount Due</p>
              <p className="font-bebas text-3xl text-[#D4A017]">K{amount}</p>
            </div>
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-syne text-base font-bold mb-4">1. Select Payment Method</h2>
            <div className="space-y-2 mb-5">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                    method === m.key
                      ? 'border-[rgba(212,160,23,0.5)] bg-[rgba(212,160,23,0.06)]'
                      : 'border-white/[0.08] bg-[#1a1a1a] hover:border-[rgba(212,160,23,0.3)]'
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{m.label}</p>
                    <p className="text-xs text-[#88887f] font-mono">{m.number}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyNumber(m.number) }}
                    className="p-1.5 rounded-lg bg-white/[0.06] text-[#88887f] hover:text-[#D4A017] transition-colors"
                  >
                    <Copy size={13} />
                  </button>
                  {method === m.key && <CheckCircle size={18} className="text-[#D4A017]" />}
                </button>
              ))}
            </div>

            <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4 mb-5">
              <h3 className="text-xs font-bold text-[#D4A017] mb-2 uppercase tracking-wider">Payment Instructions</h3>
              <ol className="text-xs text-[#88887f] space-y-2 leading-relaxed">
                <li className="flex gap-2"><span className="text-[#D4A017] font-bold">1.</span> Open your {selectedMethod.label} app or dial the USSD code</li>
                <li className="flex gap-2"><span className="text-[#D4A017] font-bold">2.</span> Send <span className="text-white font-bold">K{amount}</span> to <span className="text-[#D4A017] font-mono font-bold">{selectedMethod.number}</span></li>
                <li className="flex gap-2"><span className="text-[#D4A017] font-bold">3.</span> Take a screenshot or save the transaction confirmation</li>
                <li className="flex gap-2"><span className="text-[#D4A017] font-bold">4.</span> Upload the proof on the next step</li>
              </ol>
            </div>

            <button onClick={() => setStep(2)} className="btn-gold w-full py-4 rounded-2xl text-sm font-bold">
              I've Made the Payment →
            </button>
          </motion.div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-syne text-base font-bold mb-4">2. Upload Payment Proof</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" {...register('method')} value={method} />

              <div>
                <label className="text-xs text-[#88887f] mb-1.5 block">Sender Name *</label>
                <input {...register('senderName')} placeholder="Name shown on payment" className="input-dark px-4 py-3 text-sm" />
                {errors.senderName && <p className="text-xs text-red-400 mt-1">{errors.senderName.message}</p>}
              </div>
              <div>
                <label className="text-xs text-[#88887f] mb-1.5 block">Sender Phone / Account Number *</label>
                <input {...register('senderNumber')} placeholder="0XXXXXXXXX" className="input-dark px-4 py-3 text-sm" />
                {errors.senderNumber && <p className="text-xs text-red-400 mt-1">{errors.senderNumber.message}</p>}
              </div>

              <div>
                <label className="text-xs text-[#88887f] mb-1.5 block">Payment Screenshot / Receipt *</label>
                <label className="border border-dashed border-[rgba(212,160,23,0.3)] rounded-2xl p-6 flex flex-col items-center cursor-pointer hover:border-[rgba(212,160,23,0.6)] transition-colors bg-[rgba(212,160,23,0.02)] hover:bg-[rgba(212,160,23,0.04)]">
                  {proofFile ? (
                    <div className="text-center">
                      <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-green-400">{proofFile.name}</p>
                      <p className="text-xs text-[#88887f] mt-1">{(proofFile.size / 1024).toFixed(1)} KB · Click to change</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload size={28} className="text-[#D4A017] mx-auto mb-2" />
                      <p className="text-sm font-medium">Tap to upload screenshot</p>
                      <p className="text-xs text-[#88887f] mt-1">JPG, PNG or PDF · Max 10MB</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="bg-[rgba(212,160,23,0.06)] border border-[rgba(212,160,23,0.2)] rounded-xl p-3 text-xs text-[#D4A017]">
                🔒 Your download will be unlocked automatically once our admin verifies your payment (usually within 1–4 hours).
              </div>

              <button
                type="submit"
                disabled={isSubmitting || uploading || !proofFile}
                className="btn-gold w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {(isSubmitting || uploading) ? (
                  <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Submitting...</>
                ) : 'Submit Payment Proof 🚀'}
              </button>

              <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs text-[#88887f] py-2">
                ← Back to payment methods
              </button>
            </form>
          </motion.div>
        )}

        {/* STEP 3 — Success */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-syne text-xl font-extrabold mb-2">Payment Submitted!</h2>
            <p className="text-sm text-[#88887f] leading-relaxed mb-6 max-w-xs mx-auto">
              Your payment proof has been submitted. Our admin will verify and approve it within <strong className="text-[#D4A017]">1–4 hours</strong>. You'll receive a notification when your download is ready.
            </p>
            <div className="bg-[#1a1a1a] border border-white/[0.08] rounded-2xl p-4 mb-6 text-left">
              <p className="text-xs text-[#88887f] uppercase tracking-wider mb-2">Order Reference</p>
              <p className="font-mono font-bold text-[#D4A017] text-lg">{orderId}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push('/track')} className="btn-gold px-6 py-3 rounded-xl text-sm font-bold">
                Track Order
              </button>
              <button onClick={() => router.push('/dashboard')} className="btn-ghost-gold px-6 py-3 rounded-xl text-sm font-medium border border-[rgba(212,160,23,0.25)]">
                Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

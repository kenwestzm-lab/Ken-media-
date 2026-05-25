'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, orderBy, query } from 'firebase/firestore'
import { uploadToCloudinary } from '@/lib/cloudinary'

const CATEGORIES = ['template','branding','church','motion','social','psd','website','other']

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [tab, setTab] = useState<'products'|'services'>('products')
  const [adding, setAdding] = useState(false)
  const user = auth.currentUser

  // Product form
  const [pName, setPName]       = useState('')
  const [pDesc, setPDesc]       = useState('')
  const [pPrice, setPPrice]     = useState('')
  const [pOriginal, setPOriginal] = useState('')
  const [pCategory, setPCat]    = useState('template')
  const [pFile, setPFile]       = useState<File | null>(null)
  const [pLoading, setPLoading] = useState(false)

  // Service form
  const [sName, setSName]       = useState('')
  const [sDesc, setSDesc]       = useState('')
  const [sPrice, setSPrice]     = useState('')
  const [sDays, setSDays]       = useState('')
  const [sIcon, setSIcon]       = useState('⚡')

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db,'products'), orderBy('createdAt','desc')), snap => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
    const unsub2 = onSnapshot(query(collection(db,'services'), orderBy('createdAt','desc')), snap => setServices(snap.docs.map(d => ({ id: d.id, ...d.data() }))), () => {})
    return () => { unsub1(); unsub2() }
  }, [])

  const addProduct = async () => {
    if (!pName.trim() || !pPrice.trim()) { toast.error('Fill name and price'); return }
    setPLoading(true)
    try {
      let thumbnailUrl = ''
      if (pFile && process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        const r = await uploadToCloudinary(pFile, () => {})
        thumbnailUrl = r.url
      }
      await addDoc(collection(db,'products'), {
        name: pName, description: pDesc,
        price: parseFloat(pPrice),
        originalPrice: parseFloat(pOriginal) || parseFloat(pPrice),
        category: pCategory,
        thumbnailUrl,
        isLocked: true,
        likesCount: 0,
        downloadsCount: 0,
        rating: 5.0,
        isActive: true,
        createdAt: serverTimestamp(),
      })
      toast.success('✅ Product added — live on store now!')
      setPName(''); setPDesc(''); setPPrice(''); setPOriginal(''); setPFile(null)
      setAdding(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setPLoading(false)
    }
  }

  const addService = async () => {
    if (!sName.trim() || !sPrice.trim()) { toast.error('Fill name and price'); return }
    try {
      await addDoc(collection(db,'services'), {
        serviceName: sName,
        description: sDesc,
        startingPrice: parseFloat(sPrice),
        deliveryDays: sDays,
        icon: sIcon,
        isActive: true,
        createdAt: serverTimestamp(),
      })
      toast.success('✅ Service added — live on site now!')
      setSName(''); setSDesc(''); setSPrice(''); setSDays(''); setSIcon('⚡')
      setAdding(false)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteItem = async (id: string, coll: string) => {
    if (!confirm('Delete this item?')) return
    await deleteDoc(doc(db, coll, id))
    toast.success('Deleted')
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#222',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
    padding: '10px 12px', color: '#F0EDE6', fontSize: 13,
    outline: 'none', boxSizing: 'border-box', marginBottom: 10,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE6', paddingBottom: 60 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: '#080808', zIndex: 10 }}>
        <Link href="/admin" style={{ color: '#D4A017', textDecoration: 'none', fontSize: 22 }}>←</Link>
        <h1 style={{ flex: 1, fontFamily: 'serif', fontSize: 20, fontWeight: 800 }}>Products & <span style={{ color: '#D4A017' }}>Services</span></h1>
        <button onClick={() => setAdding(!adding)} style={{ background: 'linear-gradient(135deg,#D4A017,#F5C842)', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {(['products','services'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #D4A017' : '2px solid transparent', color: tab === t ? '#D4A017' : '#888', fontSize: 14, fontWeight: tab === t ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
            {t === 'products' ? `🛍 Products (${products.length})` : `⚡ Services (${services.length})`}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>

        {/* Add Form */}
        {adding && (
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 16, padding: 16, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#D4A017', marginBottom: 14 }}>
              {tab === 'products' ? '+ Add New Product' : '+ Add New Service'}
            </h3>

            {tab === 'products' ? (
              <>
                <input value={pName} onChange={e => setPName(e.target.value)} placeholder="Product name *" style={inp} />
                <textarea value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Description" rows={2} style={{ ...inp, resize: 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <input type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} placeholder="Price (K) *" style={{ ...inp, marginBottom: 0 }} />
                  <input type="number" value={pOriginal} onChange={e => setPOriginal(e.target.value)} placeholder="Original price" style={{ ...inp, marginBottom: 0 }} />
                </div>
                <select value={pCategory} onChange={e => setPCat(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
                <label style={{ display: 'block', cursor: 'pointer', marginBottom: 12 }}>
                  <div style={{ border: '1px dashed rgba(212,160,23,0.3)', borderRadius: 10, padding: 12, textAlign: 'center', background: pFile ? 'rgba(212,160,23,0.05)' : 'transparent' }}>
                    {pFile ? <p style={{ fontSize: 12, color: '#D4A017' }}>📎 {pFile.name}</p> : <p style={{ fontSize: 12, color: '#888' }}>📎 Upload thumbnail (optional)</p>}
                  </div>
                  <input type="file" accept="image/*" onChange={e => setPFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                </label>
                <button onClick={addProduct} disabled={pLoading}
                  style={{ width: '100%', background: pLoading ? '#333' : 'linear-gradient(135deg,#D4A017,#F5C842)', color: pLoading ? '#888' : '#000', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: pLoading ? 'not-allowed' : 'pointer' }}>
                  {pLoading ? 'Adding...' : '🚀 Add Product — Go Live Now'}
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
                  <input value={sIcon} onChange={e => setSIcon(e.target.value)} placeholder="Icon" style={{ ...inp, width: 60, flexShrink: 0, textAlign: 'center', fontSize: 20 }} />
                  <input value={sName} onChange={e => setSName(e.target.value)} placeholder="Service name *" style={{ ...inp, flex: 1 }} />
                </div>
                <textarea value={sDesc} onChange={e => setSDesc(e.target.value)} placeholder="Description" rows={2} style={{ ...inp, resize: 'none' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <input type="number" value={sPrice} onChange={e => setSPrice(e.target.value)} placeholder="Starting price (K) *" style={{ ...inp, marginBottom: 0 }} />
                  <input value={sDays} onChange={e => setSDays(e.target.value)} placeholder="Delivery (e.g. 2-3 days)" style={{ ...inp, marginBottom: 0 }} />
                </div>
                <button onClick={addService}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  🚀 Add Service — Go Live Now
                </button>
              </>
            )}
          </div>
        )}

        {/* Products list */}
        {tab === 'products' && (
          <div>
            {products.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🛍</div>
                <p style={{ fontWeight: 600 }}>No products yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Tap + Add to add your first product</p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {products.map(p => (
                <div key={p.id} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ height: 100, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {p.thumbnailUrl
                      ? <img src={p.thumbnailUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 36 }}>🎨</span>
                    }
                  </div>
                  <div style={{ padding: '10px 10px 12px' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#D4A017', marginBottom: 8 }}>K{p.price}</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div style={{ flex: 1, background: '#27AE60', borderRadius: 6, padding: '4px 0', fontSize: 10, color: '#fff', textAlign: 'center', fontWeight: 700 }}>LIVE ●</div>
                      <button onClick={() => deleteItem(p.id, 'products')} style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 6, padding: '4px 8px', color: '#E74C3C', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services list */}
        {tab === 'services' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {services.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>⚡</div>
                <p style={{ fontWeight: 600 }}>No services yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Tap + Add to add your first service</p>
              </div>
            )}
            {services.map(s => (
              <div key={s.id} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600 }}>{s.serviceName}</p>
                  <p style={{ fontSize: 12, color: '#D4A017', fontWeight: 700 }}>From K{s.startingPrice} · {s.deliveryDays}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 9, color: '#27AE60', fontWeight: 700 }}>● LIVE</span>
                  <button onClick={() => deleteItem(s.id, 'services')} style={{ background: 'rgba(231,76,60,0.1)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#E74C3C', cursor: 'pointer' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

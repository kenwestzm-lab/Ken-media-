'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { uploadToCloudinary } from '@/lib/cloudinary'
import Link from 'next/link'

export default function AdminUploadPage() {
  const router = useRouter()
  const [file, setFile]             = useState<File | null>(null)
  const [preview, setPreview]       = useState('')
  const [fileType, setFileType]     = useState('')
  const [caption, setCaption]       = useState('')
  const [price, setPrice]           = useState('')
  const [category, setCategory]     = useState('motion')
  const [tags, setTags]             = useState('')
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [showAI, setShowAI]         = useState(false)
  const [aiPrompt, setAiPrompt]     = useState('')
  const [aiLoading, setAiLoading]   = useState(false)
  const [showMusic, setShowMusic]   = useState(false)
  const [musicQuery, setMusicQuery] = useState('')
  const [tracks, setTracks]         = useState<any[]>([])
  const [selectedTrack, setTrack]   = useState<any>(null)
  const [musicLoading, setMusicLoading] = useState(false)
  const [playingId, setPlayingId]   = useState('')
  const audioRef = useRef<HTMLAudioElement>(null)
  const user = auth.currentUser

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 200 * 1024 * 1024) { toast.error('Max file size is 200MB'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    if (f.type.startsWith('video'))      setFileType('video')
    else if (f.type.startsWith('image')) setFileType('image')
    else if (f.type.startsWith('audio')) setFileType('audio')
    toast.success(`${f.name} selected ✅`)
  }

  const generateAI = async () => {
    if (!aiPrompt.trim()) { toast.error('Describe the image you want'); return }
    if (!user) { toast.error('Login required'); return }
    setAiLoading(true)
    const tid = toast.loading('🤖 Generating AI image... (10-20 seconds)')
    try {
      const res = await fetch('/api/ai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, adminId: user.uid }),
      })
      const data = await res.json()
      if (data.image) {
        setPreview(data.image)
        setFileType('image')
        const arr = data.image.split(',')
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8 = new Uint8Array(n)
        while (n--) u8[n] = bstr.charCodeAt(n)
        setFile(new File([u8], `ai-${Date.now()}.jpg`, { type: 'image/jpeg' }))
        toast.success('✨ AI image ready!', { id: tid })
      } else {
        toast.error(data.error || 'Failed. Try again.', { id: tid })
      }
    } catch (e: any) {
      toast.error(e.message, { id: tid })
    } finally {
      setAiLoading(false)
    }
  }

  const searchMusic = async () => {
    if (!musicQuery.trim()) return
    setMusicLoading(true)
    try {
      const res = await fetch(`/api/music?q=${encodeURIComponent(musicQuery)}`)
      const data = await res.json()
      setTracks(data.tracks || [])
      if (!data.tracks?.length) toast('No results. Try: afrobeat, gospel, hiphop', { icon: '🎵' })
    } catch { toast.error('Music search failed') }
    finally { setMusicLoading(false) }
  }

  const playTrack = (track: any) => {
    if (!audioRef.current) return
    if (playingId === track.id) {
      audioRef.current.pause()
      setPlayingId('')
    } else {
      audioRef.current.src = track.audio
      audioRef.current.play().catch(() => {})
      setPlayingId(track.id)
    }
  }

  const handlePost = async () => {
    if (!caption.trim()) { toast.error('Add a caption'); return }
    if (!user)           { toast.error('Not logged in'); return }
    if (!file)           { toast.error('Select or generate a file first'); return }

    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      toast.error('Cloudinary not configured — add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to env vars')
      return
    }

    setUploading(true)
    const tid = toast.loading('📤 Uploading to Cloudinary...')

    try {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file, (pct) => setProgress(pct))
      toast.loading(`📤 Saving... ${progress}%`, { id: tid })

      // Save to Firestore
      await addDoc(collection(db, 'posts'), {
        adminId:       user.uid,
        adminName:     user.displayName || 'Ken West',
        caption,
        price:         parseFloat(price) || 0,
        category,
        tags:          tags.split(',').map(t => t.trim()).filter(Boolean),
        fileUrl:       result.url,
        fileType,
        publicId:      result.publicId,
        fileSize:      result.bytes,
        width:         result.width || 0,
        height:        result.height || 0,
        duration:      result.duration || 0,
        musicUrl:      selectedTrack?.audio || '',
        musicName:     selectedTrack?.name || '',
        musicArtist:   selectedTrack?.artist_name || '',
        likesCount:    0,
        viewsCount:    0,
        commentsCount: 0,
        isActive:      true,
        createdAt:     serverTimestamp(),
      })

      toast.success('🔥 Post is LIVE in the Explore feed!', { id: tid })
      setTimeout(() => router.push('/explore'), 1500)
    } catch (err: any) {
      console.error(err)
      toast.error('Upload failed: ' + err.message, { id: tid })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
    padding: '12px 14px', color: '#F0EDE6', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE6', paddingBottom: 60 }}>
      <audio ref={audioRef} onEnded={() => setPlayingId('')} />

      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: '#080808', zIndex: 10 }}>
        <Link href="/admin" style={{ color: '#D4A017', textDecoration: 'none', fontSize: 24 }}>←</Link>
        <h1 style={{ flex: 1, fontFamily: 'serif', fontSize: 20, fontWeight: 800 }}>
          New <span style={{ color: '#D4A017' }}>Post</span>
        </h1>
        <div style={{ display: 'flex', align: 'center', gap: 6, fontSize: 11 }}>
          <span style={{ color: '#27AE60' }}>● Cloudinary</span>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {/* File Upload */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', cursor: 'pointer' }}>
            {preview ? (
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#111' }}>
                {fileType === 'image' && (
                  <img src={preview} alt="preview"
                    style={{ width: '100%', maxHeight: 380, objectFit: 'cover', display: 'block' }} />
                )}
                {fileType === 'video' && (
                  <video src={preview} controls playsInline
                    style={{ width: '100%', maxHeight: 380, display: 'block', background: '#000' }} />
                )}
                {fileType === 'audio' && (
                  <div style={{ background: 'linear-gradient(135deg,#1a0533,#080808)', padding: '32px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 64, marginBottom: 8 }}>🎵</div>
                    <p style={{ fontSize: 13, color: '#D4A017', marginBottom: 12 }}>{file?.name}</p>
                    <audio src={preview} controls style={{ width: '100%' }} />
                  </div>
                )}
                <button type="button"
                  onClick={e => { e.preventDefault(); setFile(null); setPreview(''); setFileType('') }}
                  style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', width: 34, height: 34, color: '#fff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={16} />
                </button>
                <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#D4A017', fontWeight: 700 }}>
                  {fileType.toUpperCase()} • {file ? (file.size / 1024 / 1024).toFixed(1) + 'MB' : 'AI Generated'}
                </div>
              </div>
            ) : (
              <div style={{ border: '2px dashed rgba(212,160,23,0.3)', borderRadius: 16, padding: 32, textAlign: 'center', background: 'rgba(212,160,23,0.02)' }}>
                <div style={{ fontSize: 52, marginBottom: 10 }}>📱</div>
                <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Upload from your phone</p>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Camera • Gallery • Files</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {[['📸','Photo'],['🎬','Video'],['🎵','Audio']].map(([i,l]) => (
                    <span key={l} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#888' }}>{i} {l}</span>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#555', marginTop: 10 }}>Max 200MB • Stored on Cloudinary CDN</p>
              </div>
            )}
            <input type="file" accept="image/*,video/*,audio/*" onChange={handleFile}
              style={{ display: 'none' }} />
          </label>
        </div>

        {/* AI Generator */}
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <button type="button" onClick={() => setShowAI(!showAI)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#D4A017' }}>🤖 Generate Image with AI (FREE)</span>
            <span style={{ color: '#888' }}>{showAI ? '▲' : '▼'}</span>
          </button>
          {showAI && (
            <div style={{ marginTop: 12 }}>
              <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateAI()}
                placeholder="e.g. Zambian music event poster, gold and black, fire..."
                style={{ ...inputStyle, marginBottom: 8 }} />
              <button type="button" onClick={generateAI} disabled={aiLoading}
                style={{ width: '100%', background: aiLoading ? '#333' : 'linear-gradient(135deg,#D4A017,#F5C842)', color: aiLoading ? '#888' : '#000', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
                {aiLoading ? '⏳ Generating...' : '✨ Generate FREE'}
              </button>
            </div>
          )}
        </div>

        {/* Caption */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Caption *</label>
          <textarea value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="Write an engaging caption..." rows={3}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
        </div>

        {/* Price & Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Price (K) — 0 = free</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)}
              placeholder="0" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              {['motion','branding','church','flyer','social','website','music','portfolio','video'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Tags (optional)</label>
          <input value={tags} onChange={e => setTags(e.target.value)}
            placeholder="zambia, lusaka, music, branding..."
            style={inputStyle} />
        </div>

        {/* Music */}
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <button type="button" onClick={() => setShowMusic(!showMusic)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: 0, display: 'flex', justifyContent: 'space-between', color: '#F0EDE6' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              🎵 Background Music {selectedTrack ? `· ${selectedTrack.name}` : ''}
            </span>
            <span style={{ color: '#888' }}>{showMusic ? '▲' : '▼'}</span>
          </button>

          {selectedTrack && (
            <div style={{ marginTop: 8, background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 8, padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎵</span>
              <span style={{ color: '#D4A017', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedTrack.name} — {selectedTrack.artist_name}
              </span>
              <button type="button" onClick={() => setTrack(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          )}

          {showMusic && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>Free royalty-free music — Jamendo API</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input value={musicQuery} onChange={e => setMusicQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchMusic()}
                  placeholder="afrobeat, gospel, hip hop..."
                  style={{ flex: 1, background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#F0EDE6', fontSize: 13, outline: 'none' }} />
                <button type="button" onClick={searchMusic} disabled={musicLoading}
                  style={{ background: '#D4A017', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  {musicLoading ? '...' : '🔍'}
                </button>
              </div>
              <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tracks.map(t => (
                  <div key={t.id} onClick={() => setTrack(t)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: selectedTrack?.id === t.id ? 'rgba(212,160,23,0.1)' : '#222', border: `1px solid ${selectedTrack?.id === t.id ? 'rgba(212,160,23,0.4)' : 'transparent'}`, borderRadius: 10, padding: '8px 10px', cursor: 'pointer' }}>
                    <button type="button" onClick={e => { e.stopPropagation(); playTrack(t) }}
                      style={{ width: 34, height: 34, borderRadius: '50%', background: playingId === t.id ? '#E74C3C' : '#D4A017', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <span style={{ color: playingId === t.id ? '#fff' : '#000', fontSize: 14 }}>
                        {playingId === t.id ? '⏸' : '▶'}
                      </span>
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>{t.artist_name} · {Math.floor(t.duration/60)}:{String(t.duration%60).padStart(2,'0')}</p>
                    </div>
                    {selectedTrack?.id === t.id && <Check size={16} color="#D4A017" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress */}
        {uploading && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Uploading to Cloudinary CDN...</span>
              <span style={{ fontSize: 14, color: '#D4A017', fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 50, height: 10, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#D4A017,#F5C842)', transition: 'width 0.3s', borderRadius: 50 }} />
            </div>
            {progress < 100 && (
              <p style={{ fontSize: 11, color: '#555', textAlign: 'center', marginTop: 6 }}>
                {progress < 50 ? 'Uploading file...' : progress < 90 ? 'Processing...' : 'Finalizing...'}
              </p>
            )}
          </div>
        )}

        <button type="button" onClick={handlePost} disabled={uploading}
          style={{ width: '100%', background: uploading ? '#1a1a1a' : 'linear-gradient(135deg,#D4A017,#F5C842)', color: uploading ? '#555' : '#000', border: uploading ? '1px solid #333' : 'none', borderRadius: 16, padding: '17px', fontSize: 16, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
          {uploading
            ? <><span style={{ width: 18, height: 18, border: '2px solid #333', borderTop: '2px solid #D4A017', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Uploading {progress}%</>
            : <>🔥 Post Live Now</>}
        </button>

        <p style={{ fontSize: 11, color: '#444', textAlign: 'center', marginTop: 8 }}>
          Files stored on Cloudinary • Posts go live instantly 🚀
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

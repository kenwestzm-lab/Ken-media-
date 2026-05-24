'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Music, X, Play, Check, Image as ImageIcon, Video, Mic } from 'lucide-react'
import toast from 'react-hot-toast'
import { db, storage, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import Link from 'next/link'

export default function AdminUploadPage() {
  const router = useRouter()
  const [file, setFile]           = useState<File | null>(null)
  const [preview, setPreview]     = useState('')
  const [fileType, setFileType]   = useState('')
  const [caption, setCaption]     = useState('')
  const [price, setPrice]         = useState('')
  const [category, setCategory]   = useState('motion')
  const [tags, setTags]           = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)

  // AI
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI]       = useState(false)

  // Music
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

    // Check file size - max 100MB for video
    if (f.size > 100 * 1024 * 1024) {
      toast.error('File too large. Max 100MB')
      return
    }

    setFile(f)
    setPreview(URL.createObjectURL(f))
    if (f.type.startsWith('image')) setFileType('image')
    else if (f.type.startsWith('video')) setFileType('video')
    else if (f.type.startsWith('audio')) setFileType('audio')
    toast.success(`${f.type.split('/')[0]} selected ✅`)
  }

  const generateImage = async () => {
    if (!aiPrompt.trim()) { toast.error('Enter a description'); return }
    if (!user) { toast.error('Login required'); return }
    setAiLoading(true)
    toast('🤖 Generating image... takes 10-20 seconds', { duration: 20000 })
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
        // Convert base64 to File object
        const arr = data.image.split(',')
        const mime = 'image/jpeg'
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8 = new Uint8Array(n)
        while(n--) u8[n] = bstr.charCodeAt(n)
        setFile(new File([u8], `ai-${Date.now()}.jpg`, { type: mime }))
        toast.success('✨ AI image ready!')
      } else {
        toast.error(data.error || 'Generation failed. Try again.')
      }
    } catch (e: any) {
      toast.error('Failed: ' + e.message)
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
      if (data.tracks?.length === 0) toast('No tracks found. Try: afrobeat, gospel, trap', { icon: 'ℹ️' })
    } catch { toast.error('Music search failed') }
    finally { setMusicLoading(false) }
  }

  const playTrack = (track: any) => {
    if (audioRef.current) {
      if (playingId === track.id) {
        audioRef.current.pause()
        setPlayingId('')
      } else {
        audioRef.current.src = track.audio
        audioRef.current.play().catch(() => toast.error('Audio blocked by browser'))
        setPlayingId(track.id)
      }
    }
  }

  const handlePost = async () => {
    if (!caption.trim()) { toast.error('Add a caption'); return }
    if (!user) { toast.error('Not logged in'); return }
    if (!file && !preview) { toast.error('Select a photo, video or audio file'); return }

    setUploading(true)
    let fileUrl = ''

    try {
      if (file) {
        toast('📤 Uploading... please wait', { duration: 60000, id: 'upload' })
        const storageRef = ref(storage, `posts/${Date.now()}_${file.name.replace(/\s/g,'_')}`)
        const task = uploadBytesResumable(storageRef, file)

        await new Promise<void>((resolve, reject) => {
          task.on('state_changed',
            snap => {
              const pct = Math.round(snap.bytesTransferred / snap.totalBytes * 100)
              setProgress(pct)
            },
            err => reject(err),
            async () => {
              fileUrl = await getDownloadURL(task.snapshot.ref)
              resolve()
            }
          )
        })
        toast.dismiss('upload')
      } else {
        fileUrl = preview // AI-generated base64
      }

      await addDoc(collection(db, 'posts'), {
        adminId:       user.uid,
        adminName:     user.displayName || 'Ken West',
        caption,
        price:         parseFloat(price) || 0,
        category,
        tags:          tags.split(',').map(t => t.trim()).filter(Boolean),
        fileUrl,
        fileType,
        musicUrl:      selectedTrack?.audio || '',
        musicName:     selectedTrack?.name || '',
        musicArtist:   selectedTrack?.artist_name || '',
        likesCount:    0,
        viewsCount:    0,
        commentsCount: 0,
        isActive:      true,
        createdAt:     serverTimestamp(),
      })

      toast.success('🔥 Post is LIVE! Showing in Explore feed now.')
      setTimeout(() => router.push('/explore'), 1500)
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message)
      console.error(err)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE6', paddingBottom: 40 }}>
      <audio ref={audioRef} onEnded={() => setPlayingId('')} />

      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: '#080808', zIndex: 10 }}>
        <Link href="/admin" style={{ color: '#D4A017', textDecoration: 'none', fontSize: 22, lineHeight: 1 }}>←</Link>
        <h1 style={{ flex: 1, fontFamily: 'serif', fontSize: 20, fontWeight: 800 }}>New <span style={{ color: '#D4A017' }}>Post</span></h1>
        <span style={{ fontSize: 11, color: '#27AE60', fontWeight: 700 }}>● LIVE</span>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {/* Media Upload */}
        <label style={{ display: 'block', marginBottom: 14, cursor: 'pointer' }}>
          {preview ? (
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
              {fileType === 'image' && <img src={preview} style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block', borderRadius: 16 }} />}
              {fileType === 'video' && <video src={preview} controls playsInline style={{ width: '100%', maxHeight: 360, borderRadius: 16, display: 'block' }} />}
              {fileType === 'audio' && (
                <div style={{ background: 'linear-gradient(135deg,#1a0533,#080808)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 64, marginBottom: 8 }}>🎵</div>
                  <p style={{ fontSize: 13, color: '#D4A017' }}>{file?.name}</p>
                  <audio src={preview} controls style={{ width: '100%', marginTop: 12 }} />
                </div>
              )}
              <button type="button" onClick={e => { e.preventDefault(); setFile(null); setPreview(''); setFileType('') }}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                ✕
              </button>
            </div>
          ) : (
            <div style={{ border: '2px dashed rgba(212,160,23,0.35)', borderRadius: 16, padding: 36, textAlign: 'center', background: 'rgba(212,160,23,0.02)' }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📱</div>
              <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Tap to upload from your phone</p>
              <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Photos • Videos • Audio</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {[['📸','Photo'],['🎬','Video'],['🎵','Audio']].map(([i,l]) => (
                  <span key={l} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px', fontSize: 12, color: '#888' }}>{i} {l}</span>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#555', marginTop: 10 }}>Max 100MB · MP4, MOV, JPG, PNG, MP3</p>
            </div>
          )}
          <input type="file" accept="image/*,video/*,audio/*" onChange={handleFile} style={{ display: 'none' }} capture="environment" />
        </label>

        {/* AI Image Generator */}
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(212,160,23,0.25)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <button type="button" onClick={() => setShowAI(!showAI)} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#D4A017' }}>🤖 Generate Image with AI</span>
            <span style={{ color: '#888', fontSize: 12 }}>{showAI ? '▲' : '▼'}</span>
          </button>
          {showAI && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Free AI — no API key needed. Describe your image:</p>
              <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateImage()}
                placeholder="e.g. Premium African branding design, gold and black, modern..."
                style={{ width: '100%', background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              <button type="button" onClick={generateImage} disabled={aiLoading}
                style={{ width: '100%', background: aiLoading ? '#333' : 'linear-gradient(135deg,#D4A017,#F5C842)', color: aiLoading ? '#888' : '#000', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {aiLoading ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #888', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Generating 10-20s...</> : '✨ Generate Image FREE'}
              </button>
            </div>
          )}
        </div>

        {/* Caption */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Caption *</label>
          <textarea value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="Write a caption for this post..." rows={3}
            style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 12px', color: '#F0EDE6', fontSize: 14, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5 }} />
        </div>

        {/* Price & Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Price (ZMW)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0 = free to view"
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 14, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
              {['motion','branding','church','flyer','social','website','music','portfolio'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Tags</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="zambia, logo, branding, lusaka..."
            style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Music */}
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <button type="button" onClick={() => setShowMusic(!showMusic)} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#F0EDE6' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>🎵 Add Background Music</span>
            <span style={{ color: '#888', fontSize: 12 }}>{showMusic ? '▲' : '▼'}</span>
          </button>
          {selectedTrack && (
            <div style={{ marginTop: 8, background: '#222', borderRadius: 8, padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎵</span>
              <span style={{ color: '#D4A017', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedTrack.name} — {selectedTrack.artist_name}</span>
              <button type="button" onClick={() => setTrack(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
          )}
          {showMusic && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>Free royalty-free music from Jamendo:</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input value={musicQuery} onChange={e => setMusicQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchMusic()}
                  placeholder="afrobeat, gospel, hiphop, trap..."
                  style={{ flex: 1, background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F0EDE6', fontSize: 13, outline: 'none' }} />
                <button type="button" onClick={searchMusic} disabled={musicLoading}
                  style={{ background: '#D4A017', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  {musicLoading ? '...' : 'Find'}
                </button>
              </div>
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tracks.map(t => (
                  <div key={t.id} onClick={() => setTrack(t)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, background: selectedTrack?.id === t.id ? 'rgba(212,160,23,0.1)' : '#222', border: `1px solid ${selectedTrack?.id === t.id ? 'rgba(212,160,23,0.4)' : 'transparent'}`, borderRadius: 10, padding: '8px 10px', cursor: 'pointer' }}>
                    <button type="button" onClick={e => { e.stopPropagation(); playTrack(t) }}
                      style={{ width: 32, height: 32, borderRadius: '50%', background: playingId === t.id ? '#E74C3C' : '#D4A017', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      {playingId === t.id ? <span style={{ color: '#fff', fontSize: 12 }}>⏸</span> : <Play size={12} color="#000" />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: '#888' }}>{t.artist_name} · {Math.round(t.duration/60)}:{String(t.duration%60).padStart(2,'0')}</p>
                    </div>
                    {selectedTrack?.id === t.id && <Check size={16} color="#D4A017" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {uploading && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Uploading to Firebase...</span>
              <span style={{ fontSize: 12, color: '#D4A017', fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 50, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#D4A017,#F5C842)', transition: 'width 0.3s', borderRadius: 50 }} />
            </div>
            <p style={{ fontSize: 11, color: '#555', marginTop: 4, textAlign: 'center' }}>Large videos may take 1-2 minutes...</p>
          </div>
        )}

        <button type="button" onClick={handlePost} disabled={uploading}
          style={{ width: '100%', background: uploading ? '#222' : 'linear-gradient(135deg,#D4A017,#F5C842)', color: uploading ? '#888' : '#000', border: uploading ? '1px solid #333' : 'none', borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
          {uploading
            ? <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid #888', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Uploading {progress}%</>
            : '🔥 Post Live Now'}
        </button>

        <p style={{ fontSize: 11, color: '#555', textAlign: 'center', marginTop: 8 }}>
          Goes live instantly on the Explore feed 🚀
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

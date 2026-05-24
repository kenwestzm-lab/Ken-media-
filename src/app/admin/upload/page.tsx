'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, Music, Image, Video, X, Play, Pause, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { db, storage, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import Link from 'next/link'

export default function AdminUploadPage() {
  const router = useRouter()
  const [file, setFile]           = useState<File | null>(null)
  const [preview, setPreview]     = useState<string>('')
  const [fileType, setFileType]   = useState<'image'|'video'|'audio'|''>('')
  const [caption, setCaption]     = useState('')
  const [price, setPrice]         = useState('')
  const [category, setCategory]   = useState('motion')
  const [tags, setTags]           = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [isPlaying, setPlaying]   = useState(false)

  // Music
  const [showMusic, setShowMusic]   = useState(false)
  const [musicQuery, setMusicQuery] = useState('')
  const [tracks, setTracks]         = useState<any[]>([])
  const [selectedTrack, setTrack]   = useState<any>(null)
  const [loadingMusic, setLoadingMusic] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const previewAudioRef = useRef<HTMLAudioElement>(null)

  // AI Image
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI]       = useState(false)

  const user = auth.currentUser

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
    if (f.type.startsWith('image')) setFileType('image')
    else if (f.type.startsWith('video')) setFileType('video')
    else if (f.type.startsWith('audio')) setFileType('audio')
  }

  const searchMusic = async () => {
    if (!musicQuery.trim()) return
    setLoadingMusic(true)
    try {
      const res = await fetch(`/api/music?q=${encodeURIComponent(musicQuery)}`)
      const data = await res.json()
      setTracks(data.tracks || [])
    } catch { toast.error('Music search failed') }
    finally { setLoadingMusic(false) }
  }

  const playPreview = (url: string) => {
    if (previewAudioRef.current) {
      if (isPlaying) {
        previewAudioRef.current.pause()
        setPlaying(false)
      } else {
        previewAudioRef.current.src = url
        previewAudioRef.current.play()
        setPlaying(true)
      }
    }
  }

  const generateAIImage = async () => {
    if (!aiPrompt.trim()) { toast.error('Enter a prompt'); return }
    if (!user) { toast.error('Login required'); return }
    setAiLoading(true)
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
        // Convert base64 to File
        const arr = data.image.split(',')
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) u8arr[n] = bstr.charCodeAt(n)
        const aiFile = new File([u8arr], `ai-${Date.now()}.jpg`, { type: mime })
        setFile(aiFile)
        toast.success('AI image generated! ✨')
      } else {
        toast.error(data.error || 'Generation failed — add HUGGINGFACE_API_KEY to Vercel env vars')
      }
    } catch { toast.error('AI generation failed') }
    finally { setAiLoading(false) }
  }

  const handleUpload = async () => {
    if (!file && !preview) { toast.error('Select a file first'); return }
    if (!caption.trim())    { toast.error('Add a caption'); return }
    if (!user)              { toast.error('Login required'); return }
    setUploading(true)
    try {
      let downloadUrl = ''
      if (file) {
        const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`)
        const task = uploadBytesResumable(storageRef, file)
        await new Promise<void>((resolve, reject) => {
          task.on('state_changed',
            snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            reject,
            async () => { downloadUrl = await getDownloadURL(task.snapshot.ref); resolve() }
          )
        })
      } else {
        downloadUrl = preview // AI-generated base64
      }

      await addDoc(collection(db, 'posts'), {
        adminId:      user.uid,
        caption,
        price:        parseFloat(price) || 0,
        category,
        tags:         tags.split(',').map(t => t.trim()).filter(Boolean),
        fileUrl:      downloadUrl,
        fileType,
        musicUrl:     selectedTrack?.audio || '',
        musicName:    selectedTrack?.name || '',
        musicArtist:  selectedTrack?.artist_name || '',
        likesCount:   0,
        viewsCount:   0,
        commentsCount:0,
        isActive:     true,
        createdAt:    serverTimestamp(),
      })

      toast.success('Post uploaded and live! 🔥')
      router.push('/admin')
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE6', paddingBottom: 40 }}>
      <audio ref={previewAudioRef} />

      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: '#080808', zIndex: 10 }}>
        <Link href="/admin" style={{ color: '#D4A017', textDecoration: 'none', fontSize: 20 }}>←</Link>
        <h1 style={{ fontFamily: 'serif', fontSize: 18, fontWeight: 800 }}>New <span style={{ color: '#D4A017' }}>Post</span></h1>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: '#D4A017' }}>LIVE UPLOAD</div>
      </div>

      <div style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>

        {/* File Upload Area */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', cursor: 'pointer' }}>
            {preview ? (
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#1a1a1a' }}>
                {fileType === 'image' && <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />}
                {fileType === 'video' && <video src={preview} controls style={{ width: '100%', maxHeight: 400, borderRadius: 16 }} />}
                {fileType === 'audio' && (
                  <div style={{ padding: 24, textAlign: 'center', background: '#1a1a1a' }}>
                    <div style={{ fontSize: 48, marginBottom: 8 }}>🎵</div>
                    <p style={{ fontSize: 13 }}>{file?.name}</p>
                    <audio src={preview} controls style={{ width: '100%', marginTop: 8 }} />
                  </div>
                )}
                <button
                  onClick={e => { e.preventDefault(); setFile(null); setPreview(''); setFileType('') }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ border: '2px dashed rgba(212,160,23,0.3)', borderRadius: 16, padding: 40, textAlign: 'center', background: 'rgba(212,160,23,0.02)', transition: 'all 0.2s' }}>
                <Upload size={32} color="#D4A017" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>Tap to upload</p>
                <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Photos, Videos, or Audio</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                  {[['📸','Photo'],['🎬','Video'],['🎵','Audio']].map(([icon, label]) => (
                    <span key={label} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#888' }}>{icon} {label}</span>
                  ))}
                </div>
              </div>
            )}
            <input type="file" accept="image/*,video/*,audio/*" onChange={handleFileSelect} style={{ display: 'none' }} />
          </label>
        </div>

        {/* AI Image Generator */}
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <button onClick={() => setShowAI(!showAI)} style={{ background: 'none', border: 'none', color: '#D4A017', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 0 }}>
            🤖 Generate with AI {showAI ? '▲' : '▼'}
          </button>
          {showAI && (
            <div style={{ marginTop: 10 }}>
              <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                placeholder="e.g. Premium logo design for African business, gold and black..."
                style={{ width: '100%', background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box' }} />
              <button onClick={generateAIImage} disabled={aiLoading}
                style={{ width: '100%', background: 'linear-gradient(135deg,#D4A017,#F5C842)', color: '#000', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {aiLoading ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTop: '2px solid #000', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Generating...</> : '✨ Generate Image'}
              </button>
            </div>
          )}
        </div>

        {/* Caption */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Caption *</label>
          <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write an engaging caption for this post..." rows={3}
            style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 12px', color: '#F0EDE6', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>

        {/* Price & Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Price (K)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0 = free"
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 13, outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
              {['motion','branding','church','template','social','website','video','audio'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Tags (comma separated)</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="logo, zambia, branding..."
            style={{ width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Music Picker */}
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <button onClick={() => setShowMusic(!showMusic)} style={{ background: 'none', border: 'none', color: '#F0EDE6', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 0 }}>
            🎵 Add Background Music {showMusic ? '▲' : '▼'}
          </button>
          {selectedTrack && (
            <div style={{ marginTop: 8, background: '#222', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#D4A017', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🎵</span> {selectedTrack.name} — {selectedTrack.artist_name}
              <button onClick={() => setTrack(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
            </div>
          )}
          {showMusic && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input value={musicQuery} onChange={e => setMusicQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchMusic()} placeholder="Search free music (e.g. afrobeat, trap...)"
                  style={{ flex: 1, background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 12px', color: '#F0EDE6', fontSize: 12, outline: 'none' }} />
                <button onClick={searchMusic} disabled={loadingMusic} style={{ background: '#D4A017', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  {loadingMusic ? '...' : 'Search'}
                </button>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tracks.length === 0 && !loadingMusic && (
                  <p style={{ fontSize: 11, color: '#888', textAlign: 'center', padding: 8 }}>Search for free royalty-free music from Jamendo</p>
                )}
                {tracks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: selectedTrack?.id === t.id ? 'rgba(212,160,23,0.1)' : '#222', border: `1px solid ${selectedTrack?.id === t.id ? 'rgba(212,160,23,0.4)' : 'transparent'}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}
                    onClick={() => setTrack(t)}>
                    <button onClick={e => { e.stopPropagation(); playPreview(t.audio) }} style={{ background: '#D4A017', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <Play size={12} color="#000" />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                      <p style={{ fontSize: 10, color: '#888' }}>{t.artist_name}</p>
                    </div>
                    {selectedTrack?.id === t.id && <Check size={14} color="#D4A017" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        {uploading && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ background: '#1a1a1a', borderRadius: 50, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#D4A017,#F5C842)', transition: 'width 0.3s', borderRadius: 50 }} />
            </div>
            <p style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 4 }}>Uploading... {progress}%</p>
          </div>
        )}

        <button onClick={handleUpload} disabled={uploading}
          style={{ width: '100%', background: uploading ? '#333' : 'linear-gradient(135deg,#D4A017,#F5C842)', color: uploading ? '#888' : '#000', border: 'none', borderRadius: 16, padding: 16, fontSize: 15, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {uploading ? `Uploading ${progress}%...` : '🚀 Post Live Now'}
        </button>

        <p style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 8 }}>Posts go live instantly to the Explore feed 🔥</p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

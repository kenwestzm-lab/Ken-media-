'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Play, Pause, Upload, Scissors, Music, Image as Img, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { uploadToCloudinary } from '@/lib/cloudinary'
import Link from 'next/link'

interface Track {
  id: string
  name: string
  artist_name: string
  audio: string
  duration: number
  tags?: string
}

export default function AdminUploadPage() {
  const router = useRouter()
  const user = auth.currentUser

  // Main file
  const [file, setFile]           = useState<File | null>(null)
  const [preview, setPreview]     = useState('')
  const [fileType, setFileType]   = useState('')

  // Post details
  const [caption, setCaption]     = useState('')
  const [price, setPrice]         = useState('')
  const [category, setCategory]   = useState('motion')
  const [tags, setTags]           = useState('')

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)

  // AI Image
  const [showAI, setShowAI]       = useState(false)
  const [aiPrompt, setAiPrompt]   = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Music — phone upload
  const [musicFile, setMusicFile]     = useState<File | null>(null)
  const [musicPreview, setMusicPreview] = useState('')
  const [musicDuration, setMusicDuration] = useState(0)
  const [trimStart, setTrimStart]     = useState(0)
  const [trimEnd, setTrimEnd]         = useState(0)
  const [musicPlaying, setMusicPlaying] = useState(false)

  // Music — Pixabay search
  const [showMusic, setShowMusic]     = useState(false)
  const [musicTab, setMusicTab]       = useState<'upload'|'search'>('upload')
  const [searchQuery, setSearchQuery] = useState('')
  const [tracks, setTracks]           = useState<Track[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedTrack, setTrack]     = useState<Track | null>(null)
  const [playingId, setPlayingId]     = useState('')
  const [pixabaySetup, setPixabaySetup] = useState(false)

  const trimAudioRef   = useRef<HTMLAudioElement>(null)
  const searchAudioRef = useRef<HTMLAudioElement>(null)
  const animRef        = useRef<number>(0)

  // Load music file from phone
  const handleMusicFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('audio')) { toast.error('Select an audio file (MP3, WAV, AAC)'); return }
    if (f.size > 50 * 1024 * 1024) { toast.error('Audio file max 50MB'); return }
    setMusicFile(f)
    const url = URL.createObjectURL(f)
    setMusicPreview(url)
    setTrack(null) // clear search selection
    toast.success(`🎵 ${f.name} loaded`)
  }

  // When audio metadata loads, set duration and trim end
  const handleAudioLoaded = () => {
    if (trimAudioRef.current) {
      const dur = trimAudioRef.current.duration
      if (!isNaN(dur)) {
        setMusicDuration(dur)
        setTrimEnd(dur)
        setTrimStart(0)
      }
    }
  }

  // Play trimmed preview
  const playTrimPreview = () => {
    const audio = trimAudioRef.current
    if (!audio) return
    if (musicPlaying) {
      audio.pause()
      setMusicPlaying(false)
      cancelAnimationFrame(animRef.current)
    } else {
      audio.currentTime = trimStart
      audio.play().catch(() => toast.error('Cannot play audio'))
      setMusicPlaying(true)
      const check = () => {
        if (audio.currentTime >= trimEnd) {
          audio.pause()
          audio.currentTime = trimStart
          setMusicPlaying(false)
        } else {
          animRef.current = requestAnimationFrame(check)
        }
      }
      animRef.current = requestAnimationFrame(check)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2,'0')}`
  }

  const trimLength = trimEnd - trimStart

  // Pixabay music search
  const searchPixabay = async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    try {
      const res = await fetch(`/api/music?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.setup) {
        setPixabaySetup(true)
        setTracks([])
      } else {
        setPixabaySetup(false)
        setTracks(data.tracks || [])
        if (!data.tracks?.length) toast('No results. Try: background, cinematic, upbeat', { icon: '🎵' })
      }
    } catch { toast.error('Search failed') }
    finally { setSearchLoading(false) }
  }

  const playSearchTrack = (track: Track) => {
    const audio = searchAudioRef.current
    if (!audio) return
    if (playingId === track.id) {
      audio.pause()
      setPlayingId('')
    } else {
      audio.src = track.audio
      audio.play().catch(() => toast.error('Cannot play this track'))
      setPlayingId(track.id)
    }
  }

  const selectTrack = (track: Track) => {
    setTrack(track)
    setMusicFile(null)
    setMusicPreview('')
    toast.success(`🎵 "${track.name}" selected`)
  }

  // Main file select
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 200 * 1024 * 1024) { toast.error('Max 200MB'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
    if      (f.type.startsWith('video')) setFileType('video')
    else if (f.type.startsWith('image')) setFileType('image')
    else if (f.type.startsWith('audio')) setFileType('audio')
    toast.success(`✅ ${f.name}`)
  }

  // AI image generation
  const generateAI = async () => {
    if (!aiPrompt.trim()) { toast.error('Describe the image'); return }
    if (!user) { toast.error('Login required'); return }
    setAiLoading(true)
    const tid = toast.loading('🤖 Generating... 10-20 seconds')
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
        const arr   = data.image.split(',')
        const bstr  = atob(arr[1])
        let n = bstr.length
        const u8 = new Uint8Array(n)
        while (n--) u8[n] = bstr.charCodeAt(n)
        setFile(new File([u8], `ai-${Date.now()}.jpg`, { type: 'image/jpeg' }))
        toast.success('✨ Image ready!', { id: tid })
      } else {
        toast.error(data.error || 'Failed', { id: tid })
      }
    } catch (e: any) { toast.error(e.message, { id: tid }) }
    finally { setAiLoading(false) }
  }

  // Post everything
  const handlePost = async () => {
    if (!caption.trim()) { toast.error('Add a caption'); return }
    if (!user) { toast.error('Not logged in'); return }
    if (!file) { toast.error('Select or generate a file'); return }
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      toast.error('Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to Vercel env vars')
      return
    }

    setUploading(true)
    const tid = toast.loading('📤 Uploading...')

    try {
      // 1. Upload main file
      const result = await uploadToCloudinary(file, setProgress)
      toast.loading('☁️ Processing...', { id: tid })

      // 2. Upload music from phone if selected
      let musicUrl = selectedTrack?.audio || ''
      let musicName = selectedTrack?.name || ''
      let musicArtist = selectedTrack?.artist_name || ''
      let musicStartTime = 0
      let musicEndTime = 0

      if (musicFile) {
        toast.loading('🎵 Uploading music...', { id: tid })
        const musicResult = await uploadToCloudinary(musicFile, () => {})
        musicUrl    = musicResult.url
        musicName   = musicFile.name.replace(/\.[^/.]+$/, '')
        musicArtist = 'Ken Media'
        musicStartTime = trimStart
        musicEndTime   = trimEnd > 0 ? trimEnd : musicResult.duration || 0
      }

      // 3. Save to Firestore
      await addDoc(collection(db, 'posts'), {
        adminId:        user.uid,
        adminName:      user.displayName || 'Ken West',
        caption,
        price:          parseFloat(price) || 0,
        category,
        tags:           tags.split(',').map(t => t.trim()).filter(Boolean),
        fileUrl:        result.url,
        fileType,
        publicId:       result.publicId,
        fileSize:       result.bytes,
        width:          result.width  || 0,
        height:         result.height || 0,
        duration:       result.duration || 0,
        musicUrl,
        musicName,
        musicArtist,
        musicStartTime,
        musicEndTime,
        likesCount:     0,
        viewsCount:     0,
        commentsCount:  0,
        isActive:       true,
        createdAt:      serverTimestamp(),
      })

      toast.success('🔥 Post is LIVE!', { id: tid })
      setTimeout(() => router.push('/explore'), 1200)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message, { id: tid })
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '12px 14px',
    color: '#F0EDE6', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE6', paddingBottom: 60 }}>
      <audio ref={searchAudioRef} onEnded={() => setPlayingId('')} />
      {musicPreview && (
        <audio ref={trimAudioRef} src={musicPreview}
          onLoadedMetadata={handleAudioLoaded}
          onEnded={() => setMusicPlaying(false)} />
      )}

      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: '#080808', zIndex: 10 }}>
        <Link href="/admin" style={{ color: '#D4A017', textDecoration: 'none', fontSize: 24 }}>←</Link>
        <h1 style={{ flex: 1, fontFamily: 'serif', fontSize: 20, fontWeight: 800 }}>
          New <span style={{ color: '#D4A017' }}>Post</span>
        </h1>
        <span style={{ fontSize: 11, color: '#27AE60', fontWeight: 700 }}>● LIVE</span>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {/* Main file upload */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', cursor: 'pointer' }}>
            {preview ? (
              <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#111' }}>
                {fileType === 'image' && (
                  <img src={preview} alt="preview"
                    style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block' }} />
                )}
                {fileType === 'video' && (
                  <video src={preview} controls playsInline
                    style={{ width: '100%', maxHeight: 360, display: 'block', background: '#000' }} />
                )}
                {fileType === 'audio' && (
                  <div style={{ background: 'linear-gradient(135deg,#1a0533,#080808)', padding: '28px 20px', textAlign: 'center', borderRadius: 16 }}>
                    <div style={{ fontSize: 56, marginBottom: 6 }}>🎵</div>
                    <p style={{ fontSize: 13, color: '#D4A017' }}>{file?.name}</p>
                    <audio src={preview} controls style={{ width: '100%', marginTop: 10 }} />
                  </div>
                )}
                <button type="button"
                  onClick={e => { e.preventDefault(); setFile(null); setPreview(''); setFileType('') }}
                  style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={15} />
                </button>
                <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '3px 10px', fontSize: 11, color: '#D4A017', fontWeight: 700 }}>
                  {fileType.toUpperCase()} · {file ? (file.size / 1024 / 1024).toFixed(1) + 'MB' : 'AI'}
                </div>
              </div>
            ) : (
              <div style={{ border: '2px dashed rgba(212,160,23,0.3)', borderRadius: 16, padding: 28, textAlign: 'center', background: 'rgba(212,160,23,0.02)' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
                <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Upload Photo, Video or Audio</p>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>From your camera or gallery</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  {[['📸','Photo'],['🎬','Video'],['🎵','Audio']].map(([i,l]) => (
                    <span key={String(l)} style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '5px 12px', fontSize: 11, color: '#888' }}>{i} {l}</span>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: '#555', marginTop: 8 }}>Max 200MB · Stored on Cloudinary CDN</p>
              </div>
            )}
            <input type="file" accept="image/*,video/*,audio/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>
        </div>

        {/* AI Generator */}
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <button type="button" onClick={() => setShowAI(!showAI)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#D4A017' }}>🤖 Generate Image with AI — FREE</span>
            <span style={{ color: '#888' }}>{showAI ? '▲' : '▼'}</span>
          </button>
          {showAI && (
            <div style={{ marginTop: 12 }}>
              <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && generateAI()}
                placeholder="e.g. Zambia music event poster, gold flames, dark background..."
                style={{ ...inp, marginBottom: 8 }} />
              <button type="button" onClick={generateAI} disabled={aiLoading}
                style={{ width: '100%', background: aiLoading ? '#333' : 'linear-gradient(135deg,#D4A017,#F5C842)', color: aiLoading ? '#888' : '#000', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
                {aiLoading ? '⏳ Generating 10-20s...' : '✨ Generate Image FREE'}
              </button>
            </div>
          )}
        </div>

        {/* Caption */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Caption *</label>
          <textarea value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="Write an engaging caption for this post..." rows={3}
            style={{ ...inp, resize: 'none', lineHeight: 1.5 }} />
        </div>

        {/* Price & Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Price (K) — 0 = free</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              {['motion','branding','church','flyer','social','website','music','portfolio','video'].map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Tags</label>
          <input value={tags} onChange={e => setTags(e.target.value)}
            placeholder="zambia, lusaka, music, branding..." style={inp} />
        </div>

        {/* ====== MUSIC SECTION ====== */}
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <button type="button" onClick={() => setShowMusic(!showMusic)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#F0EDE6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Music size={16} color="#D4A017" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Background Music
                {(musicFile || selectedTrack) && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: '#D4A017' }}>
                    ✓ {musicFile ? musicFile.name.replace(/\.[^/.]+$/,'') : selectedTrack?.name}
                  </span>
                )}
              </span>
            </div>
            <span style={{ color: '#888' }}>{showMusic ? '▲' : '▼'}</span>
          </button>

          {showMusic && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {([['upload','📱 Upload from Phone'],['search','🔍 Search Pixabay']] as const).map(([tab, label]) => (
                  <button key={tab} type="button" onClick={() => setMusicTab(tab)}
                    style={{ flex: 1, padding: '10px 0', background: musicTab === tab ? 'rgba(212,160,23,0.1)' : 'none', border: 'none', borderBottom: musicTab === tab ? '2px solid #D4A017' : '2px solid transparent', color: musicTab === tab ? '#D4A017' : '#888', fontSize: 13, fontWeight: musicTab === tab ? 600 : 400, cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Upload tab */}
              {musicTab === 'upload' && (
                <div style={{ padding: 14 }}>
                  <p style={{ fontSize: 12, color: '#888', marginBottom: 10 }}>
                    Upload any music from your phone (MP3, WAV, AAC) — max 50MB
                  </p>

                  <label style={{ display: 'block', cursor: 'pointer', marginBottom: musicFile ? 14 : 0 }}>
                    <div style={{ border: '1px dashed rgba(212,160,23,0.3)', borderRadius: 12, padding: '14px', textAlign: 'center', background: musicFile ? 'rgba(212,160,23,0.05)' : 'transparent' }}>
                      {musicFile ? (
                        <div>
                          <div style={{ fontSize: 24, marginBottom: 4 }}>🎵</div>
                          <p style={{ fontSize: 12, color: '#D4A017', fontWeight: 600 }}>{musicFile.name}</p>
                          <p style={{ fontSize: 11, color: '#888' }}>{(musicFile.size/1024/1024).toFixed(1)}MB · Tap to change</p>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 28, marginBottom: 6 }}>🎵</div>
                          <p style={{ fontSize: 13, fontWeight: 600 }}>Tap to select music</p>
                          <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>MP3, WAV, AAC, M4A</p>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="audio/*" onChange={handleMusicFile} style={{ display: 'none' }} />
                  </label>

                  {/* AUDIO TRIMMER */}
                  {musicFile && musicDuration > 0 && (
                    <div style={{ background: '#222', borderRadius: 12, padding: 14, marginTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Scissors size={14} color="#D4A017" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#D4A017' }}>Audio Trimmer</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#888' }}>
                          {formatTime(trimStart)} → {formatTime(trimEnd)} ({formatTime(trimLength)})
                        </span>
                      </div>

                      {/* Waveform visual */}
                      <div style={{ background: '#1a1a1a', borderRadius: 8, height: 40, marginBottom: 10, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                        {Array.from({ length: 60 }).map((_, i) => (
                          <div key={i} style={{
                            flex: 1, marginRight: 1,
                            height: `${20 + Math.sin(i * 0.7) * 15 + Math.random() * 5}px`,
                            background: i / 60 >= trimStart / musicDuration && i / 60 <= trimEnd / musicDuration
                              ? '#D4A017' : 'rgba(212,160,23,0.2)',
                            borderRadius: 2,
                            transition: 'background 0.1s',
                          }} />
                        ))}
                      </div>

                      {/* Start slider */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: '#888' }}>Start: {formatTime(trimStart)}</span>
                        </div>
                        <input type="range" min={0} max={musicDuration} step={0.5}
                          value={trimStart}
                          onChange={e => {
                            const val = parseFloat(e.target.value)
                            if (val < trimEnd - 1) setTrimStart(val)
                          }}
                          style={{ width: '100%', accentColor: '#D4A017' }} />
                      </div>

                      {/* End slider */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: '#888' }}>End: {formatTime(trimEnd)}</span>
                        </div>
                        <input type="range" min={0} max={musicDuration} step={0.5}
                          value={trimEnd}
                          onChange={e => {
                            const val = parseFloat(e.target.value)
                            if (val > trimStart + 1) setTrimEnd(val)
                          }}
                          style={{ width: '100%', accentColor: '#D4A017' }} />
                      </div>

                      {/* Preview play button */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={playTrimPreview}
                          style={{ flex: 1, background: musicPlaying ? '#E74C3C' : 'linear-gradient(135deg,#D4A017,#F5C842)', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, color: musicPlaying ? '#fff' : '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {musicPlaying ? <><Pause size={14} /> Stop Preview</> : <><Play size={14} /> Preview Trim</>}
                        </button>
                        <button type="button" onClick={() => { setTrimStart(0); setTrimEnd(musicDuration) }}
                          style={{ background: '#333', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#888', cursor: 'pointer' }}>
                          Reset
                        </button>
                      </div>

                      <p style={{ fontSize: 10, color: '#555', marginTop: 6, textAlign: 'center' }}>
                        Selected: {formatTime(trimLength)} of audio will play with your post
                      </p>
                    </div>
                  )}

                  {musicFile && musicDuration === 0 && (
                    <p style={{ fontSize: 11, color: '#888', textAlign: 'center', marginTop: 8 }}>
                      Loading audio info...
                    </p>
                  )}
                </div>
              )}

              {/* Pixabay search tab */}
              {musicTab === 'search' && (
                <div style={{ padding: 14 }}>
                  {pixabaySetup ? (
                    <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#D4A017', marginBottom: 6 }}>⚙️ Setup Pixabay API</p>
                      <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Get your FREE key in 2 minutes:</p>
                      <ol style={{ fontSize: 12, color: '#888', paddingLeft: 16, lineHeight: 2 }}>
                        <li>Go to <span style={{ color: '#D4A017' }}>pixabay.com</span> → Sign up FREE</li>
                        <li>Go to <span style={{ color: '#D4A017' }}>pixabay.com/api/docs</span></li>
                        <li>Copy your API key</li>
                        <li>Add to Vercel: <span style={{ color: '#D4A017', fontFamily: 'monospace', fontSize: 11 }}>PIXABAY_API_KEY</span></li>
                        <li>Redeploy</li>
                      </ol>
                    </div>
                  ) : null}

                  <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                    Search free background music from Pixabay:
                  </p>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchPixabay()}
                      placeholder="background, cinematic, upbeat, hip hop..."
                      style={{ flex: 1, background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#F0EDE6', fontSize: 13, outline: 'none' }} />
                    <button type="button" onClick={searchPixabay} disabled={searchLoading}
                      style={{ background: '#D4A017', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                      {searchLoading ? '...' : '🔍'}
                    </button>
                  </div>

                  {/* Music keywords guide */}
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ fontSize: 10, color: '#555', marginBottom: 6 }}>Try these searches:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['background','cinematic','upbeat','hip hop','electronic','acoustic','inspirational','dramatic'].map(kw => (
                        <button key={kw} type="button"
                          onClick={() => { setSearchQuery(kw); }}
                          style={{ background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, padding: '4px 10px', fontSize: 11, color: '#888', cursor: 'pointer' }}>
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {tracks.map(t => (
                      <div key={t.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: selectedTrack?.id === t.id ? 'rgba(212,160,23,0.1)' : '#222', border: `1px solid ${selectedTrack?.id === t.id ? 'rgba(212,160,23,0.4)' : 'transparent'}`, borderRadius: 10, padding: '9px 10px', cursor: 'pointer' }}
                        onClick={() => selectTrack(t)}>
                        <button type="button" onClick={e => { e.stopPropagation(); playSearchTrack(t) }}
                          style={{ width: 34, height: 34, borderRadius: '50%', background: playingId === t.id ? '#E74C3C' : '#D4A017', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                          <span style={{ fontSize: 12, color: playingId === t.id ? '#fff' : '#000' }}>
                            {playingId === t.id ? '⏸' : '▶'}
                          </span>
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                          <p style={{ fontSize: 11, color: '#888' }}>{t.artist_name} · {formatTime(t.duration)}</p>
                        </div>
                        {selectedTrack?.id === t.id && <Check size={16} color="#D4A017" />}
                      </div>
                    ))}
                    {tracks.length === 0 && !searchLoading && !pixabaySetup && (
                      <p style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: 16 }}>
                        Search above for free background music 🎵
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress */}
        {uploading && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: '#888' }}>Uploading to Cloudinary...</span>
              <span style={{ fontSize: 14, color: '#D4A017', fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ background: '#1a1a1a', borderRadius: 50, height: 10, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#D4A017,#F5C842)', transition: 'width 0.2s', borderRadius: 50 }} />
            </div>
          </div>
        )}

        <button type="button" onClick={handlePost} disabled={uploading}
          style={{ width: '100%', background: uploading ? '#1a1a1a' : 'linear-gradient(135deg,#D4A017,#F5C842)', color: uploading ? '#555' : '#000', border: uploading ? '1px solid #333' : 'none', borderRadius: 16, padding: '17px', fontSize: 16, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {uploading
            ? <><span style={{ width: 18, height: 18, border: '2px solid #333', borderTop: '2px solid #D4A017', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> {progress}% Uploading...</>
            : <>🔥 Post Live Now</>}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

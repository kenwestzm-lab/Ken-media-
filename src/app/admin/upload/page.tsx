'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Play, Pause, Music, Scissors, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { uploadToCloudinary } from '@/lib/cloudinary'
import Link from 'next/link'

interface Track {
  id: string; name: string; artist_name: string; audio: string; duration: number
}

export default function AdminUploadPage() {
  const router  = useRouter()
  const user    = auth.currentUser

  // Main file
  const [file, setFile]       = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [fileType, setFileType] = useState('')

  // Post details
  const [caption, setCaption]   = useState('')
  const [price, setPrice]       = useState('')
  const [category, setCategory] = useState('motion')
  const [tags, setTags]         = useState('')

  // Upload state
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [uploadMsg, setUploadMsg] = useState('')

  // AI
  const [showAI, setShowAI]     = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Music — phone upload + trim
  const [musicFile, setMusicFile]       = useState<File | null>(null)
  const [musicPreview, setMusicPreview] = useState('')
  const [musicDuration, setMusicDuration] = useState(0)
  const [trimStart, setTrimStart]       = useState(0)
  const [trimEnd, setTrimEnd]           = useState(0)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [trimming, setTrimming]         = useState(false)
  const [trimProgress, setTrimProgress] = useState(0)
  const [trimmedFile, setTrimmedFile]   = useState<File | null>(null)
  const [trimmedPreview, setTrimmedPreview] = useState('')

  // Music — online search
  const [showMusic, setShowMusic]     = useState(false)
  const [musicTab, setMusicTab]       = useState<'upload'|'search'>('upload')
  const [searchQuery, setSearchQuery] = useState('')
  const [tracks, setTracks]           = useState<Track[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedTrack, setTrack]     = useState<Track | null>(null)
  const [playingId, setPlayingId]     = useState('')
  const [needsKey, setNeedsKey]       = useState(false)

  const trimAudioRef   = useRef<HTMLAudioElement>(null)
  const searchAudioRef = useRef<HTMLAudioElement>(null)
  const animRef        = useRef<number>(0)

  const formatTime = (s: number) => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`

  // Load main file
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 200 * 1024 * 1024) { toast.error('Max 200MB'); return }
    setFile(f); setPreview(URL.createObjectURL(f))
    if      (f.type.startsWith('video')) setFileType('video')
    else if (f.type.startsWith('image')) setFileType('image')
    else if (f.type.startsWith('audio')) setFileType('audio')
    toast.success(`✅ ${f.name}`)
  }

  // Load music from phone
  const handleMusicFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('audio')) { toast.error('Select audio file'); return }
    if (f.size > 50 * 1024 * 1024)  { toast.error('Max 50MB for audio'); return }
    setMusicFile(f); setMusicPreview(URL.createObjectURL(f))
    setTrimmedFile(null); setTrimmedPreview('')
    setTrack(null)
    toast.success(`🎵 ${f.name} loaded`)
  }

  // Audio metadata loaded
  const handleAudioMeta = () => {
    if (trimAudioRef.current) {
      const dur = trimAudioRef.current.duration
      if (!isNaN(dur) && isFinite(dur)) {
        setMusicDuration(dur); setTrimEnd(dur); setTrimStart(0)
      }
    }
  }

  // Preview trim
  const playTrimPreview = () => {
    const audio = trimAudioRef.current
    if (!audio) return
    if (musicPlaying) {
      audio.pause(); setMusicPlaying(false)
      cancelAnimationFrame(animRef.current)
    } else {
      audio.currentTime = trimStart
      audio.play().catch(() => toast.error('Cannot play audio'))
      setMusicPlaying(true)
      const check = () => {
        if (!trimAudioRef.current) return
        if (trimAudioRef.current.currentTime >= trimEnd) {
          trimAudioRef.current.pause()
          trimAudioRef.current.currentTime = trimStart
          setMusicPlaying(false)
        } else {
          animRef.current = requestAnimationFrame(check)
        }
      }
      animRef.current = requestAnimationFrame(check)
    }
  }

  // REAL AUDIO TRIM using Web Audio API
  const applyTrim = async () => {
    if (!musicFile) { toast.error('No audio file loaded'); return }
    if (trimEnd - trimStart < 1) { toast.error('Select at least 1 second'); return }
    setTrimming(true)
    setTrimProgress(0)
    try {
      const { trimAudioFile } = await import('@/lib/audioTrimmer')
      toast.loading(`✂️ Trimming ${formatTime(trimStart)} → ${formatTime(trimEnd)}...`, { id: 'trim' })
      const trimmed = await trimAudioFile(musicFile, trimStart, trimEnd, setTrimProgress)
      setTrimmedFile(trimmed)
      setTrimmedPreview(URL.createObjectURL(trimmed))
      toast.success(`✅ Trimmed! ${formatTime(trimEnd - trimStart)} of audio ready`, { id: 'trim' })
    } catch (err: any) {
      toast.error('Trim failed: ' + err.message, { id: 'trim' })
    } finally {
      setTrimming(false)
    }
  }

  // Search music online (Freesound)
  const searchMusic = async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    try {
      const res  = await fetch(`/api/music?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      setTracks(data.tracks || [])
      setNeedsKey(data.needsKey || false)
      if (!data.tracks?.length) toast('No results — try: background, upbeat, cinematic', { icon: '🎵' })
    } catch { toast.error('Search failed') }
    finally { setSearchLoading(false) }
  }

  // Play online track preview
  const playTrack = (track: Track) => {
    const audio = searchAudioRef.current
    if (!audio) return
    if (playingId === track.id) {
      audio.pause(); setPlayingId('')
    } else {
      audio.src = track.audio
      audio.volume = 1
      audio.play().catch(e => {
        toast.error('Audio blocked. Tap again or try another track.')
        console.error('Audio play error:', e)
      })
      setPlayingId(track.id)
    }
  }

  // AI image
  const generateAI = async () => {
    if (!aiPrompt.trim()) { toast.error('Describe the image'); return }
    if (!user) { toast.error('Login required'); return }
    setAiLoading(true)
    const tid = toast.loading('🤖 Generating... 15-20 seconds')
    try {
      const res  = await fetch('/api/ai-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: aiPrompt, adminId: user.uid }) })
      const data = await res.json()
      if (data.image) {
        setPreview(data.image); setFileType('image')
        const arr = data.image.split(','), bstr = atob(arr[1])
        let n = bstr.length; const u8 = new Uint8Array(n)
        while (n--) u8[n] = bstr.charCodeAt(n)
        setFile(new File([u8], `ai-${Date.now()}.jpg`, { type: 'image/jpeg' }))
        toast.success('✨ AI image ready!', { id: tid })
      } else {
        toast.error(data.error || 'Failed. Try simpler description.', { id: tid })
      }
    } catch (e: any) { toast.error(e.message, { id: tid }) }
    finally { setAiLoading(false) }
  }

  // POST everything live
  const handlePost = async () => {
    if (!caption.trim()) { toast.error('Add a caption'); return }
    if (!user)           { toast.error('Not logged in'); return }
    if (!file)           { toast.error('Select or generate a file'); return }
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      toast.error('Cloudinary not configured — check Vercel env vars'); return
    }

    setUploading(true)
    setUploadMsg('Uploading media...')
    const tid = toast.loading('📤 Uploading...')

    try {
      // 1. Upload main file
      const result = await uploadToCloudinary(file, p => { setProgress(p); setUploadMsg(`Uploading media ${p}%`) })

      // 2. Upload music (trimmed file takes priority over original)
      let musicUrl = selectedTrack?.audio || ''
      let musicName = selectedTrack?.name || ''
      let musicArtist = selectedTrack?.artist_name || ''
      let musicStartTime = 0
      let musicEndTime = 0

      const musicToUpload = trimmedFile || musicFile
      if (musicToUpload) {
        setUploadMsg('Uploading music...')
        toast.loading('🎵 Uploading music...', { id: tid })
        const musicResult = await uploadToCloudinary(musicToUpload, () => {})
        musicUrl       = musicResult.url
        musicName      = trimmedFile
          ? `${musicFile!.name.replace(/\.[^/.]+$/,'')} (${formatTime(trimStart)}-${formatTime(trimEnd)})`
          : musicFile!.name.replace(/\.[^/.]+$/,'')
        musicArtist    = 'Ken Media'
        musicStartTime = trimmedFile ? 0 : trimStart
        musicEndTime   = trimmedFile ? (trimEnd - trimStart) : trimEnd
      }

      setUploadMsg('Saving to database...')

      // 3. Save to Firestore
      await addDoc(collection(db, 'posts'), {
        adminId:        user.uid,
        adminName:      user.displayName || 'Ken West',
        caption, price: parseFloat(price) || 0, category,
        tags:           tags.split(',').map(t => t.trim()).filter(Boolean),
        fileUrl:        result.url,
        fileType,
        publicId:       result.publicId,
        fileSize:       result.bytes,
        width:          result.width  || 0,
        height:         result.height || 0,
        duration:       result.duration || 0,
        musicUrl, musicName, musicArtist,
        musicStartTime, musicEndTime,
        likesCount: 0, viewsCount: 0, commentsCount: 0,
        isActive: true,
        createdAt: serverTimestamp(),
      })

      toast.success('🔥 Post is LIVE on Explore feed!', { id: tid })
      setTimeout(() => router.push('/explore'), 1200)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message, { id: tid })
    } finally {
      setUploading(false)
      setProgress(0)
      setUploadMsg('')
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '12px 14px', color: '#F0EDE6', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  const trimLength = trimEnd - trimStart

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#F0EDE6', paddingBottom: 60 }}>
      <audio ref={searchAudioRef} onEnded={() => setPlayingId('')} crossOrigin="anonymous" />
      {musicPreview && (
        <audio ref={trimAudioRef} src={musicPreview}
          onLoadedMetadata={handleAudioMeta}
          onEnded={() => { setMusicPlaying(false); cancelAnimationFrame(animRef.current) }} />
      )}

      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: '#080808', zIndex: 10 }}>
        <Link href="/admin" style={{ color: '#D4A017', textDecoration: 'none', fontSize: 24 }}>←</Link>
        <h1 style={{ flex: 1, fontFamily: 'serif', fontSize: 20, fontWeight: 800 }}>New <span style={{ color: '#D4A017' }}>Post</span></h1>
        <span style={{ fontSize: 11, color: '#27AE60', fontWeight: 700 }}>● LIVE</span>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>

        {/* File Upload */}
        <label style={{ display: 'block', marginBottom: 14, cursor: 'pointer' }}>
          {preview ? (
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
              {fileType === 'image' && <img src={preview} style={{ width: '100%', maxHeight: 360, objectFit: 'cover', display: 'block', borderRadius: 16 }} />}
              {fileType === 'video' && <video src={preview} controls playsInline style={{ width: '100%', maxHeight: 360, display: 'block', borderRadius: 16 }} />}
              {fileType === 'audio' && (
                <div style={{ background: 'linear-gradient(135deg,#1a0533,#080808)', borderRadius: 16, padding: '32px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 56, marginBottom: 8 }}>🎵</div>
                  <p style={{ color: '#D4A017', fontSize: 13 }}>{file?.name}</p>
                  <audio src={preview} controls style={{ width: '100%', marginTop: 10 }} />
                </div>
              )}
              <button type="button" onClick={e => { e.preventDefault(); setFile(null); setPreview(''); setFileType('') }}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
              <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '3px 10px', fontSize: 11, color: '#D4A017', fontWeight: 700 }}>
                {fileType.toUpperCase()} · {file ? (file.size/1024/1024).toFixed(1)+'MB' : 'AI'}
              </div>
            </div>
          ) : (
            <div style={{ border: '2px dashed rgba(212,160,23,0.3)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📱</div>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Upload Photo, Video or Audio</p>
              <p style={{ fontSize: 12, color: '#888' }}>Camera · Gallery · Files · Max 200MB</p>
            </div>
          )}
          <input type="file" accept="image/*,video/*,audio/*" onChange={handleFile} style={{ display: 'none' }} />
        </label>

        {/* AI Generator */}
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
          <button type="button" onClick={() => setShowAI(!showAI)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: 0, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#D4A017' }}>🤖 Generate Image with AI (FREE)</span>
            <span style={{ color: '#888' }}>{showAI ? '▲' : '▼'}</span>
          </button>
          {showAI && (
            <div style={{ marginTop: 10 }}>
              <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateAI()}
                placeholder="Zambia music poster, gold flames, dark background..." style={{ ...inp, marginBottom: 8 }} />
              <button type="button" onClick={generateAI} disabled={aiLoading}
                style={{ width: '100%', background: aiLoading ? '#333' : 'linear-gradient(135deg,#D4A017,#F5C842)', color: aiLoading ? '#888' : '#000', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
                {aiLoading ? '⏳ Generating 15-20s...' : '✨ Generate FREE'}
              </button>
            </div>
          )}
        </div>

        {/* Caption */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>Caption *</label>
          <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} placeholder="Write an engaging caption..."
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
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="zambia, music, branding..." style={inp} />
        </div>

        {/* MUSIC SECTION */}
        <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <button type="button" onClick={() => setShowMusic(!showMusic)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#F0EDE6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Music size={16} color="#D4A017" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                Background Music
                {(trimmedFile || musicFile || selectedTrack) && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: '#27AE60' }}>✓ Added</span>
                )}
              </span>
            </div>
            <span style={{ color: '#888' }}>{showMusic ? '▲' : '▼'}</span>
          </button>

          {showMusic && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Tabs */}
              <div style={{ display: 'flex' }}>
                {([['upload','📱 From Phone'],['search','🔍 Search Online']] as const).map(([tab, label]) => (
                  <button key={tab} type="button" onClick={() => setMusicTab(tab)}
                    style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: musicTab === tab ? '2px solid #D4A017' : '2px solid transparent', color: musicTab === tab ? '#D4A017' : '#888', fontSize: 13, fontWeight: musicTab === tab ? 700 : 400, cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Upload tab with REAL trimmer */}
              {musicTab === 'upload' && (
                <div style={{ padding: 14 }}>
                  <label style={{ display: 'block', cursor: 'pointer', marginBottom: 12 }}>
                    <div style={{ border: '1px dashed rgba(212,160,23,0.3)', borderRadius: 12, padding: 14, textAlign: 'center', background: musicFile ? 'rgba(212,160,23,0.05)' : 'transparent' }}>
                      {musicFile
                        ? <p style={{ fontSize: 13, color: '#D4A017', fontWeight: 600 }}>🎵 {musicFile.name} · {(musicFile.size/1024/1024).toFixed(1)}MB</p>
                        : <><div style={{ fontSize: 28, marginBottom: 4 }}>🎵</div><p style={{ fontSize: 13 }}>Tap to select MP3/WAV from phone</p></>
                      }
                    </div>
                    <input type="file" accept="audio/*" onChange={handleMusicFile} style={{ display: 'none' }} />
                  </label>

                  {/* Trimmer */}
                  {musicFile && musicDuration > 0 && (
                    <div style={{ background: '#222', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Scissors size={14} color="#D4A017" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#D4A017' }}>Trim Audio</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#888' }}>
                          {formatTime(trimStart)} → {formatTime(trimEnd)} ({formatTime(trimLength)})
                        </span>
                      </div>

                      {/* Visual waveform */}
                      <div style={{ background: '#1a1a1a', borderRadius: 8, height: 44, marginBottom: 12, display: 'flex', alignItems: 'center', padding: '0 4px', overflow: 'hidden', gap: 1 }}>
                        {Array.from({ length: 55 }).map((_, i) => {
                          const pct = i / 55
                          const inRange = pct >= trimStart/musicDuration && pct <= trimEnd/musicDuration
                          return (
                            <div key={i} style={{
                              flex: 1,
                              height: `${15 + Math.abs(Math.sin(i * 0.8)) * 22 + Math.abs(Math.sin(i * 1.5)) * 8}px`,
                              background: inRange ? '#D4A017' : 'rgba(212,160,23,0.18)',
                              borderRadius: 2,
                              transition: 'background 0.15s',
                            }} />
                          )
                        })}
                      </div>

                      {/* Start slider */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: '#888' }}>Start</span>
                          <span style={{ fontSize: 11, color: '#D4A017', fontWeight: 600 }}>{formatTime(trimStart)}</span>
                        </div>
                        <input type="range" min={0} max={musicDuration} step={0.1}
                          value={trimStart}
                          onChange={e => { const v = parseFloat(e.target.value); if (v < trimEnd - 0.5) setTrimStart(v) }}
                          style={{ width: '100%', accentColor: '#D4A017', height: 4 }} />
                      </div>

                      {/* End slider */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: '#888' }}>End</span>
                          <span style={{ fontSize: 11, color: '#D4A017', fontWeight: 600 }}>{formatTime(trimEnd)}</span>
                        </div>
                        <input type="range" min={0} max={musicDuration} step={0.1}
                          value={trimEnd}
                          onChange={e => { const v = parseFloat(e.target.value); if (v > trimStart + 0.5) setTrimEnd(v) }}
                          style={{ width: '100%', accentColor: '#D4A017', height: 4 }} />
                      </div>

                      {/* Trim progress */}
                      {trimming && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ background: '#1a1a1a', borderRadius: 50, height: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${trimProgress}%`, height: '100%', background: 'linear-gradient(90deg,#D4A017,#F5C842)', transition: 'width 0.2s', borderRadius: 50 }} />
                          </div>
                          <p style={{ fontSize: 11, color: '#D4A017', textAlign: 'center', marginTop: 4 }}>Trimming audio... {trimProgress}%</p>
                        </div>
                      )}

                      {/* Trimmed result */}
                      {trimmedFile && (
                        <div style={{ background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.3)', borderRadius: 10, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Check size={14} color="#27AE60" />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, color: '#27AE60', fontWeight: 600 }}>Trimmed: {formatTime(trimLength)}</p>
                            <p style={{ fontSize: 11, color: '#888' }}>{(trimmedFile.size/1024).toFixed(0)}KB ready to upload</p>
                          </div>
                          <audio src={trimmedPreview} controls style={{ height: 28, width: 140 }} />
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={playTrimPreview} disabled={trimming}
                          style={{ flex: 1, background: musicPlaying ? '#E74C3C' : 'rgba(212,160,23,0.15)', border: `1px solid ${musicPlaying ? '#E74C3C' : 'rgba(212,160,23,0.3)'}`, borderRadius: 10, padding: 10, fontSize: 12, fontWeight: 600, color: musicPlaying ? '#fff' : '#D4A017', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {musicPlaying ? <><Pause size={13} /> Stop</> : <><Play size={13} /> Preview</>}
                        </button>
                        <button type="button" onClick={applyTrim} disabled={trimming}
                          style={{ flex: 1, background: trimming ? '#333' : 'linear-gradient(135deg,#D4A017,#F5C842)', border: 'none', borderRadius: 10, padding: 10, fontSize: 12, fontWeight: 700, color: trimming ? '#888' : '#000', cursor: trimming ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          {trimming ? '✂️ Trimming...' : <><Scissors size={13} /> Apply Trim</>}
                        </button>
                        <button type="button" onClick={() => { setTrimStart(0); setTrimEnd(musicDuration); setTrimmedFile(null); setTrimmedPreview('') }}
                          style={{ background: '#333', border: 'none', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#888', cursor: 'pointer' }}>
                          Reset
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Online search tab */}
              {musicTab === 'search' && (
                <div style={{ padding: 14 }}>
                  {needsKey && (
                    <div style={{ background: 'rgba(212,160,23,0.06)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 10, padding: 10, marginBottom: 10, fontSize: 11, color: '#D4A017' }}>
                      ℹ️ Using sample tracks. Add FREESOUND_API_KEY to Vercel for full library of 500k+ tracks.
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchMusic()}
                      placeholder="background, cinematic, upbeat, hip hop..."
                      style={{ flex: 1, background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#F0EDE6', fontSize: 13, outline: 'none' }} />
                    <button type="button" onClick={searchMusic} disabled={searchLoading}
                      style={{ background: '#D4A017', border: 'none', borderRadius: 8, padding: '9px 16px', color: '#000', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                      {searchLoading ? '...' : '🔍'}
                    </button>
                  </div>

                  {/* Quick keyword buttons */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {['background','cinematic','upbeat','hip hop','electronic','gospel'].map(kw => (
                      <button key={kw} type="button" onClick={() => { setSearchQuery(kw); }}
                        style={{ background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 50, padding: '4px 10px', fontSize: 11, color: '#888', cursor: 'pointer' }}>
                        {kw}
                      </button>
                    ))}
                  </div>

                  <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {tracks.map(t => (
                      <div key={t.id} onClick={() => { setTrack(t); setMusicFile(null); setMusicPreview(''); setTrimmedFile(null) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: selectedTrack?.id === t.id ? 'rgba(212,160,23,0.1)' : '#222', border: `1px solid ${selectedTrack?.id === t.id ? 'rgba(212,160,23,0.4)' : 'transparent'}`, borderRadius: 10, padding: '9px 10px', cursor: 'pointer' }}>
                        <button type="button" onClick={e => { e.stopPropagation(); playTrack(t) }}
                          style={{ width: 36, height: 36, borderRadius: '50%', background: playingId === t.id ? '#E74C3C' : '#D4A017', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 14, color: playingId === t.id ? '#fff' : '#000' }}>
                          {playingId === t.id ? '⏸' : '▶'}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                          <p style={{ fontSize: 11, color: '#888' }}>{t.artist_name} · {formatTime(t.duration)}</p>
                        </div>
                        {selectedTrack?.id === t.id && <Check size={16} color="#D4A017" />}
                      </div>
                    ))}
                    {tracks.length === 0 && !searchLoading && (
                      <p style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: 16 }}>Search for free background music 🎵</p>
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
              <span style={{ fontSize: 12, color: '#888' }}>{uploadMsg}</span>
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
            ? <><span style={{ width: 18, height: 18, border: '2px solid #333', borderTop: '2px solid #D4A017', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> {uploadMsg || 'Uploading...'}</>
            : '🔥 Post Live Now'}
        </button>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

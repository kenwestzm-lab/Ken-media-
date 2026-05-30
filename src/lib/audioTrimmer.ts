// Real audio trimming using Web Audio API
// Encodes trimmed audio as WAV file

export const trimAudioFile = async (
  audioFile: File,
  startTime: number,
  endTime: number,
  onProgress?: (pct: number) => void
): Promise<File> => {
  onProgress?.(10)

  const arrayBuffer = await audioFile.arrayBuffer()
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

  onProgress?.(30)
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  onProgress?.(50)

  const sampleRate    = audioBuffer.sampleRate
  const startSample   = Math.floor(startTime * sampleRate)
  const endSample     = Math.floor(endTime * sampleRate)
  const trimmedLength = endSample - startSample

  const trimmedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    trimmedLength,
    sampleRate
  )

  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const src = audioBuffer.getChannelData(ch)
    const dst = trimmedBuffer.getChannelData(ch)
    for (let i = 0; i < trimmedLength; i++) {
      dst[i] = src[startSample + i]
    }
  }

  onProgress?.(70)
  const wavBuffer = audioBufferToWav(trimmedBuffer)
  onProgress?.(90)

  const trimmedFile = new File(
    [wavBuffer],
    `trimmed_${startTime.toFixed(0)}s_${endTime.toFixed(0)}s_${Date.now()}.wav`,
    { type: 'audio/wav' }
  )

  audioContext.close()
  onProgress?.(100)
  return trimmedFile
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels
  const sampleRate  = buffer.sampleRate
  const format      = 1 // PCM
  const bitDepth    = 16
  const numSamples  = buffer.length
  const dataSize    = numSamples * numChannels * (bitDepth / 8)
  const bufferSize  = 44 + dataSize
  const arrayBuf    = new ArrayBuffer(bufferSize)
  const view        = new DataView(arrayBuf)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4,  bufferSize - 8,           true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16,                        true)
  view.setUint16(20, format,                    true)
  view.setUint16(22, numChannels,               true)
  view.setUint32(24, sampleRate,                true)
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true)
  view.setUint16(32, numChannels * (bitDepth / 8), true)
  view.setUint16(34, bitDepth,                  true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize,                  true)

  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }
  return arrayBuf
}

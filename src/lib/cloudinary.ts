// src/lib/cloudinary.ts
// Upload any file to Cloudinary FREE tier
// No server needed - direct browser upload

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

export interface UploadResult {
  url: string
  publicId: string
  resourceType: string
  format: string
  duration?: number
  width?: number
  height?: number
  bytes: number
}

export const uploadToCloudinary = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'ken-media')

  // Detect resource type
  let resourceType = 'image'
  if (file.type.startsWith('video')) resourceType = 'video'
  if (file.type.startsWith('audio')) resourceType = 'video' // Cloudinary uses video for audio

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100)
        onProgress(pct)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          resourceType: data.resource_type,
          format: data.format,
          duration: data.duration,
          width: data.width,
          height: data.height,
          bytes: data.bytes,
        })
      } else {
        const err = JSON.parse(xhr.responseText)
        reject(new Error(err.error?.message || 'Upload failed'))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error')))
    xhr.open('POST', url)
    xhr.send(formData)
  })
}

export const getCloudinaryUrl = (publicId: string, options?: {
  width?: number
  height?: number
  quality?: string
  format?: string
}) => {
  const transforms = []
  if (options?.width) transforms.push(`w_${options.width}`)
  if (options?.height) transforms.push(`h_${options.height}`)
  if (options?.quality) transforms.push(`q_${options.quality}`)
  transforms.push('f_auto') // Auto format

  const t = transforms.join(',')
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t}/${publicId}`
}

// Generate thumbnail from video
export const getVideoThumbnail = (publicId: string) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_0,f_jpg,w_600/${publicId}.jpg`

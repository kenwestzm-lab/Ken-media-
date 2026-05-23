// src/types/index.ts

export type UserRole = 'customer' | 'admin'

export interface UserProfile {
  id?: string
  uid: string
  displayName: string
  email: string
  phone?: string
  photoURL?: string
  role: UserRole
  createdAt?: any
  updatedAt?: any
}

export type OrderStatus =
  | 'pending'
  | 'payment_reviewing'
  | 'approved'
  | 'in_progress'
  | 'ready'
  | 'delivered'
  | 'revision_requested'
  | 'rejected'

export interface Order {
  id?: string
  orderNumber?: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  serviceName?: string
  productId?: string
  productName?: string
  description?: string
  amount: number
  status: OrderStatus
  statusNote?: string
  deadline?: string
  referenceFiles?: string[]
  downloadUrl?: string
  isDownloadUnlocked?: boolean
  unlockedFor?: Record<string, boolean>
  createdAt?: any
  updatedAt?: any
}

export type PaymentMethod = 'airtel_money' | 'mtn_money' | 'bank_transfer'
export type PaymentStatus = 'pending_review' | 'approved' | 'rejected'

export interface Payment {
  id?: string
  orderId: string
  userId: string
  userName: string
  amount: number
  method: PaymentMethod
  proofUrl?: string
  status: PaymentStatus
  approvedAt?: any
  rejectionReason?: string
  createdAt?: any
  updatedAt?: any
}

export type ProductCategory =
  | 'template'
  | 'branding'
  | 'motion'
  | 'church'
  | 'social'
  | 'psd'

export interface Product {
  id?: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: ProductCategory
  thumbnailUrl?: string
  previewUrls?: string[]
  downloadUrl?: string
  fileSize?: string
  fileFormats?: string[]
  isLocked: boolean
  unlockedFor?: Record<string, boolean>
  likesCount: number
  downloadsCount: number
  rating?: number
  reviewCount?: number
  tags?: string[]
  isFeatured?: boolean
  isActive?: boolean
  createdAt?: any
  updatedAt?: any
}

export interface ServiceRequest {
  id?: string
  serviceName: string
  startingPrice: number
  description: string
  deliveryDays: string
  icon: string
  isActive?: boolean
}

export interface Message {
  id?: string
  senderId: string
  receiverId: string
  senderName: string
  text: string
  attachmentUrl?: string
  read: boolean
  createdAt?: any
}

export interface Conversation {
  id?: string
  participants: string[]
  lastMessage?: string
  lastMessageAt?: any
  unreadCount?: Record<string, number>
}

export interface Notification {
  id?: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt?: any
}

export interface AIGeneration {
  id?: string
  adminId: string
  tool: string
  prompt: string
  result: string
  model?: string
  createdAt?: any
}

export interface Comment {
  id?: string
  productId: string
  userId: string
  userName: string
  text: string
  createdAt?: any
}

export interface AdminLog {
  id?: string
  action: string
  adminId?: string
  details?: any
  timestamp?: any
}

// src/lib/firestore.ts
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, Timestamp,
  QueryConstraint, DocumentData, increment
} from 'firebase/firestore'
import { db } from './firebase'
import { Order, Product, Message, Payment, UserProfile } from '@/types'

// ===================== USERS =====================
export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  await addDoc(collection(db, 'users'), {
    uid,
    ...data,
    role: 'customer',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const getUserProfile = async (uid: string) => {
  const q = query(collection(db, 'users'), where('uid', '==', uid))
  const snap = await getDocs(q)
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
}

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const q = query(collection(db, 'users'), where('uid', '==', uid))
  const snap = await getDocs(q)
  if (!snap.empty) {
    await updateDoc(doc(db, 'users', snap.docs[0].id), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  }
}

// ===================== PRODUCTS =====================
export const getProducts = async (filters?: { category?: string }) => {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]
  if (filters?.category) {
    constraints.unshift(where('category', '==', filters.category))
  }
  const q = query(collection(db, 'products'), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
}

export const getProductById = async (id: string) => {
  const snap = await getDoc(doc(db, 'products', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } as Product : null
}

export const addProduct = async (data: Partial<Product>) => {
  return await addDoc(collection(db, 'products'), {
    ...data,
    downloadsCount: 0,
    likesCount: 0,
    isLocked: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateProduct = async (id: string, data: Partial<Product>) => {
  await updateDoc(doc(db, 'products', id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export const deleteProduct = async (id: string) => {
  await deleteDoc(doc(db, 'products', id))
}

// ===================== ORDERS =====================
export const createOrder = async (data: Partial<Order>) => {
  const ref = await addDoc(collection(db, 'orders'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // Log admin activity
  await addDoc(collection(db, 'admin_logs'), {
    action: 'new_order',
    orderId: ref.id,
    timestamp: serverTimestamp(),
  })
  return ref
}

export const getOrdersByUser = async (userId: string) => {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}

export const getAllOrders = async () => {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}

export const updateOrderStatus = async (id: string, status: Order['status'], note?: string) => {
  await updateDoc(doc(db, 'orders', id), {
    status,
    statusNote: note || '',
    updatedAt: serverTimestamp(),
  })
  await addDoc(collection(db, 'admin_logs'), {
    action: 'order_status_update',
    orderId: id,
    newStatus: status,
    timestamp: serverTimestamp(),
  })
}

// Listen for real-time order updates
export const subscribeToOrder = (orderId: string, callback: (data: Order | null) => void) => {
  return onSnapshot(doc(db, 'orders', orderId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } as Order : null)
  })
}

// ===================== PAYMENTS =====================
export const createPayment = async (data: Partial<Payment>) => {
  return await addDoc(collection(db, 'payments'), {
    ...data,
    status: 'pending_review',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const getPendingPayments = async () => {
  const q = query(
    collection(db, 'payments'),
    where('status', '==', 'pending_review'),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment))
}

export const approvePayment = async (paymentId: string, orderId: string) => {
  // Approve payment
  await updateDoc(doc(db, 'payments', paymentId), {
    status: 'approved',
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  // Update order status
  await updateOrderStatus(orderId, 'approved')
  // Unlock download
  const orderSnap = await getDoc(doc(db, 'orders', orderId))
  if (orderSnap.exists()) {
    const order = orderSnap.data()
    if (order.productId) {
      await updateDoc(doc(db, 'products', order.productId), {
        [`unlockedFor.${order.userId}`]: true,
      })
    }
  }
  // Send notification
  await addDoc(collection(db, 'notifications'), {
    userId: (await getDoc(doc(db, 'orders', orderId))).data()?.userId,
    type: 'payment_approved',
    title: 'Payment Approved! 🎉',
    message: 'Your payment has been approved. Your download is now unlocked.',
    read: false,
    createdAt: serverTimestamp(),
  })
}

export const rejectPayment = async (paymentId: string, orderId: string, reason: string) => {
  await updateDoc(doc(db, 'payments', paymentId), {
    status: 'rejected',
    rejectionReason: reason,
    updatedAt: serverTimestamp(),
  })
  await updateOrderStatus(orderId, 'rejected', reason)
}

// ===================== MESSAGES =====================
export const sendMessage = async (conversationId: string, data: Partial<Message>) => {
  await addDoc(collection(db, 'messages', conversationId, 'chats'), {
    ...data,
    createdAt: serverTimestamp(),
    read: false,
  })
  // Update conversation metadata
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: data.text,
    lastMessageAt: serverTimestamp(),
    [`unreadCount.${data.receiverId}`]: increment(1),
  }).catch(async () => {
    // Create conversation if doesn't exist
    await addDoc(collection(db, 'conversations'), {
      participants: [data.senderId, data.receiverId],
      lastMessage: data.text,
      lastMessageAt: serverTimestamp(),
      unreadCount: { [data.receiverId!]: 1 },
    })
  })
}

export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
) => {
  const q = query(
    collection(db, 'messages', conversationId, 'chats'),
    orderBy('createdAt', 'asc'),
    limit(100)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)))
  })
}

// ===================== LIKES =====================
export const toggleLike = async (productId: string, userId: string) => {
  const likeRef = doc(db, 'likes', `${productId}_${userId}`)
  const likeSnap = await getDoc(likeRef)
  if (likeSnap.exists()) {
    await deleteDoc(likeRef)
    await updateDoc(doc(db, 'products', productId), { likesCount: increment(-1) })
    return false
  } else {
    await updateDoc(likeRef, { productId, userId, createdAt: serverTimestamp() })
    await updateDoc(doc(db, 'products', productId), { likesCount: increment(1) })
    return true
  }
}

// ===================== COMMENTS =====================
export const addComment = async (productId: string, data: { userId: string; text: string; userName: string }) => {
  await addDoc(collection(db, 'comments'), {
    productId,
    ...data,
    createdAt: serverTimestamp(),
  })
}

export const getComments = async (productId: string) => {
  const q = query(
    collection(db, 'comments'),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc'),
    limit(50)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ===================== NOTIFICATIONS =====================
export const subscribeToNotifications = (userId: string, callback: (notifs: any[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export const markNotificationRead = async (id: string) => {
  await updateDoc(doc(db, 'notifications', id), { read: true })
}

// ===================== ADMIN ANALYTICS =====================
export const getAdminStats = async () => {
  const [ordersSnap, usersSnap, pendingPaySnap] = await Promise.all([
    getDocs(collection(db, 'orders')),
    getDocs(collection(db, 'users')),
    getDocs(query(collection(db, 'payments'), where('status', '==', 'pending_review'))),
  ])
  const orders = ordersSnap.docs.map(d => d.data())
  const totalRevenue = orders
    .filter(o => o.status === 'approved' || o.status === 'delivered')
    .reduce((sum, o) => sum + (o.amount || 0), 0)
  return {
    totalOrders: ordersSnap.size,
    totalClients: usersSnap.size,
    pendingPayments: pendingPaySnap.size,
    totalRevenue,
  }
}

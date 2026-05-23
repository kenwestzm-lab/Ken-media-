// src/store/useStore.ts
import { create } from 'zustand'
import { UserProfile, Order, Notification } from '@/types'

interface AppState {
  // Auth
  user: UserProfile | null
  isLoading: boolean
  setUser: (user: UserProfile | null) => void
  setLoading: (loading: boolean) => void

  // Orders
  orders: Order[]
  setOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrder: (id: string, data: Partial<Order>) => void

  // Notifications
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifs: Notification[]) => void

  // UI
  isMenuOpen: boolean
  activeModal: string | null
  setMenuOpen: (open: boolean) => void
  setActiveModal: (modal: string | null) => void

  // Cart / Current order
  currentOrderService: string | null
  currentOrderPrice: number | null
  setCurrentOrder: (service: string | null, price: number | null) => void
}

const useStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),

  // Orders
  orders: [],
  setOrders: (orders) => set({ orders }),
  addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
  updateOrder: (id, data) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...data } : o)),
    })),

  // Notifications
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),

  // UI
  isMenuOpen: false,
  activeModal: null,
  setMenuOpen: (isMenuOpen) => set({ isMenuOpen }),
  setActiveModal: (activeModal) => set({ activeModal }),

  // Current order
  currentOrderService: null,
  currentOrderPrice: null,
  setCurrentOrder: (currentOrderService, currentOrderPrice) =>
    set({ currentOrderService, currentOrderPrice }),
}))

export default useStore

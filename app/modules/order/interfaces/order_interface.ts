import LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import type { OrderStatus } from '#modules/order/models/order'
import Order from '#modules/order/models/order'
import { DateTime } from 'luxon'

namespace IOrder {
  export interface Repository extends LucidRepositoryInterface<typeof Order> {
    findByOrderNumber(orderNumber: string): Promise<Order | null>

    findByRetrievalCode(retrievalCode: string): Promise<Order | null>

    findByStore(storeId: number, filters?: OrderFilters): Promise<Order[]>

    findPendingByStore(storeId: number): Promise<Order[]>

    findExpiredOrders(): Promise<Order[]>

    getStoreMetrics(storeId: number): Promise<StoreMetrics>
  }

  export enum Status {
    SENT = 'sent',
    RECEIVED = 'received',
    AWAITING_STORAGE = 'awaiting_storage',
    STORED = 'stored',
    AWAITING_RETRIEVAL = 'awaiting_retrieval',
    RETRIEVED = 'retrieved',
    CANCELLATION_PENDING = 'cancellation_pending',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
  }

  export interface CreateOrderData {
    order_number: string
    customer_id: number
    store_id: number
    items: CreateOrderItemData[]
    metadata?: Record<string, any>
  }

  export interface CreateOrderItemData {
    product_name: string
    quantity: number
    sku: string
    price: number
    metadata?: Record<string, any>
  }

  export interface UpdateOrderStatusData {
    order_id: number
    status: OrderStatus
    user_id: number
    reason?: string
    metadata?: Record<string, any>
  }

  export interface StoreOrderData {
    order_id: number
    locker_id: number
    user_id: number
  }

  export interface RetrieveOrderData {
    retrieval_code?: string
    customer_cpf?: string
    user_id: number
  }

  export interface CancelOrderData {
    order_id: number
    reason: string
    user_id: number
  }

  export interface SendNotificationData {
    order_id: number
    type: 'whatsapp' | 'sms' | 'email'
    content?: string
    template?: string
  }

  export interface OrderFilters {
    status?: OrderStatus
    customerId?: number
    lockerId?: number
    dateFrom?: DateTime
    dateTo?: DateTime
    search?: string
  }

  export interface StoreMetrics {
    total: number
    sent: number
    received: number
    awaiting_storage: number
    stored: number
    awaiting_retrieval: number
    retrieved: number
    cancellation_pending: number
    cancelled: number
    expired: number
  }

  export interface DashboardMetrics {
    sent: number
    received: number
    awaiting_storage: number
    stored: number
    awaiting_retrieval: number
    retrieved: number
    cancelled: number
    expired: number
    pending_cancellation: number
  }

  export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    sent: ['received', 'cancellation_pending'],
    received: ['awaiting_storage', 'cancellation_pending'],
    awaiting_storage: ['stored', 'cancellation_pending'],
    stored: ['awaiting_retrieval', 'cancellation_pending'],
    awaiting_retrieval: ['retrieved', 'cancellation_pending'],
    retrieved: [],
    cancellation_pending: ['cancelled', 'sent', 'received', 'awaiting_storage', 'stored'],
    cancelled: [],
    expired: [],
  }

  export function canTransitionTo(fromStatus: OrderStatus, toStatus: OrderStatus): boolean {
    return STATUS_TRANSITIONS[fromStatus]?.includes(toStatus) || false
  }
}

export default IOrder

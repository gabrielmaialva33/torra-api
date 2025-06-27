import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import string from '@adonisjs/core/helpers/string'

import Customer from '#modules/customer/models/customer'
import Store from '#modules/store/models/store'
import Locker from '#modules/locker/models/locker'
import OrderItem from '#modules/order/models/order_item'
import OrderNotification from '#modules/order/models/order_notification'
import OrderStatusHistory from '#modules/order/models/order_status_history'

export type OrderStatus =
  | 'sent'
  | 'received'
  | 'awaiting_storage'
  | 'stored'
  | 'awaiting_retrieval'
  | 'retrieved'
  | 'cancellation_pending'
  | 'cancelled'
  | 'expired'

export default class Order extends BaseModel {
  static table = 'orders'

  /**
   * ------------------------------------------------------
   * Columns
   * ------------------------------------------------------
   */
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare order_number: string

  @column()
  declare customer_id: number

  @column()
  declare store_id: number

  @column()
  declare locker_id: number | null

  @column()
  declare status: OrderStatus

  @column.dateTime()
  declare sent_at: DateTime

  @column.dateTime()
  declare received_at: DateTime | null

  @column.dateTime()
  declare stored_at: DateTime | null

  @column.dateTime()
  declare retrieved_at: DateTime | null

  @column.dateTime()
  declare cancelled_at: DateTime | null

  @column.dateTime()
  declare expiration_date: DateTime

  @column()
  declare retrieval_code: string | null

  @column()
  declare cancellation_reason: string | null

  @column()
  declare metadata: Record<string, any>

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime | null

  /**
   * ------------------------------------------------------
   * Relationships
   * ------------------------------------------------------
   */
  @belongsTo(() => Customer, {
    foreignKey: 'customer_id',
  })
  declare customer: BelongsTo<typeof Customer>

  @belongsTo(() => Store, {
    foreignKey: 'store_id',
  })
  declare store: BelongsTo<typeof Store>

  @belongsTo(() => Locker, {
    foreignKey: 'locker_id',
  })
  declare locker: BelongsTo<typeof Locker>

  @hasMany(() => OrderItem, {
    foreignKey: 'order_id',
  })
  declare items: HasMany<typeof OrderItem>

  @hasMany(() => OrderNotification, {
    foreignKey: 'order_id',
  })
  declare notifications: HasMany<typeof OrderNotification>

  @hasMany(() => OrderStatusHistory, {
    foreignKey: 'order_id',
  })
  declare statusHistory: HasMany<typeof OrderStatusHistory>

  /**
   * ------------------------------------------------------
   * Helpers
   * ------------------------------------------------------
   */
  get isExpired(): boolean {
    return this.expiration_date < DateTime.now()
  }

  get daysUntilExpiration(): number {
    return Math.ceil(this.expiration_date.diff(DateTime.now(), 'days').days)
  }

  get canBeCancelled(): boolean {
    return ['sent', 'received', 'awaiting_storage', 'stored'].includes(this.status)
  }

  get canBeStored(): boolean {
    return ['received', 'awaiting_storage'].includes(this.status)
  }

  get canBeRetrieved(): boolean {
    return ['stored', 'awaiting_retrieval'].includes(this.status)
  }

  get statusLabel(): string {
    const labels: Record<OrderStatus, string> = {
      sent: 'Enviado para loja',
      received: 'Recebido pela loja',
      awaiting_storage: 'Aguardando armazenamento',
      stored: 'Armazenado',
      awaiting_retrieval: 'Aguardando retirada',
      retrieved: 'Retirado',
      cancellation_pending: 'Cancelamento pendente',
      cancelled: 'Cancelado',
      expired: 'Expirado',
    }
    return labels[this.status]
  }

  /**
   * ------------------------------------------------------
   * Hooks
   * ------------------------------------------------------
   */
  @beforeCreate()
  static async generateRetrievalCode(order: Order) {
    if (order.status === 'stored' && !order.retrieval_code) {
      order.retrieval_code = string.generateRandom(6).toUpperCase()
    }
  }

  @beforeCreate()
  static async setExpirationDate(order: Order) {
    if (!order.expiration_date) {
      order.expiration_date = DateTime.now().plus({ days: 30 })
    }
  }

  /**
   * ------------------------------------------------------
   * Query Scopes
   * ------------------------------------------------------
   */
  static byStatus = (query: any, status: OrderStatus) => {
    return query.where('status', status)
  }

  static byStore = (query: any, storeId: number) => {
    return query.where('store_id', storeId)
  }

  static byCustomer = (query: any, customerId: number) => {
    return query.where('customer_id', customerId)
  }

  static byOrderNumber = (query: any, orderNumber: string) => {
    return query.where('order_number', orderNumber)
  }

  static expired = (query: any) => {
    return query.where('expiration_date', '<', DateTime.now().toSQL())
  }

  static aboutToExpire = (query: any, days: number = 3) => {
    return query
      .where('expiration_date', '<=', DateTime.now().plus({ days }).toSQL())
      .where('expiration_date', '>', DateTime.now().toSQL())
  }

  static pendingCancellation = (query: any) => {
    return query.where('status', 'cancellation_pending')
  }
}

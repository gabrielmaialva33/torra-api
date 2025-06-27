import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Order from '#modules/order/models/order'

export type NotificationType = 'whatsapp' | 'sms' | 'email'
export type NotificationStatus = 'pending' | 'sent' | 'failed'

export default class OrderNotification extends BaseModel {
  static table = 'order_notifications'

  /**
   * ------------------------------------------------------
   * Columns
   * ------------------------------------------------------
   */
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare order_id: number

  @column()
  declare type: NotificationType

  @column()
  declare status: NotificationStatus

  @column.dateTime()
  declare sent_at: DateTime | null

  @column()
  declare content: string

  @column()
  declare metadata: {
    recipient?: string
    response?: any
    error?: string
    attempts?: number
  }

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updated_at: DateTime | null

  /**
   * ------------------------------------------------------
   * Relationships
   * ------------------------------------------------------
   */
  @belongsTo(() => Order, {
    foreignKey: 'order_id',
  })
  declare order: BelongsTo<typeof Order>

  /**
   * ------------------------------------------------------
   * Helpers
   * ------------------------------------------------------
   */
  get isPending(): boolean {
    return this.status === 'pending'
  }

  get isSent(): boolean {
    return this.status === 'sent'
  }

  get isFailed(): boolean {
    return this.status === 'failed'
  }

  /**
   * ------------------------------------------------------
   * Query Scopes
   * ------------------------------------------------------
   */
  static byType = (query: any, type: NotificationType) => {
    return query.where('type', type)
  }

  static byStatus = (query: any, status: NotificationStatus) => {
    return query.where('status', status)
  }

  static pending = (query: any) => {
    return query.where('status', 'pending')
  }

  static failed = (query: any) => {
    return query.where('status', 'failed')
  }
}

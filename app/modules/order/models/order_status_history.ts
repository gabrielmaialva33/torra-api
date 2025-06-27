import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import type { OrderStatus } from '#modules/order/models/order'
import Order from '#modules/order/models/order'
import User from '#modules/user/models/user'

export default class OrderStatusHistory extends BaseModel {
  static table = 'order_status_histories'

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
  declare from_status: OrderStatus | null

  @column()
  declare to_status: OrderStatus

  @column()
  declare changed_by: number

  @column()
  declare reason: string | null

  @column()
  declare metadata: {
    ip_address?: string
    user_agent?: string
    location?: string
    [key: string]: any
  }

  @column.dateTime({ autoCreate: true })
  declare created_at: DateTime

  /**
   * ------------------------------------------------------
   * Relationships
   * ------------------------------------------------------
   */
  @belongsTo(() => Order, {
    foreignKey: 'order_id',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User, {
    foreignKey: 'changed_by',
  })
  declare user: BelongsTo<typeof User>

  /**
   * ------------------------------------------------------
   * Query Scopes
   * ------------------------------------------------------
   */
  static byOrder = (query: any, orderId: number) => {
    return query.where('order_id', orderId)
  }

  static byUser = (query: any, userId: number) => {
    return query.where('changed_by', userId)
  }

  static recent = (query: any) => {
    return query.orderBy('created_at', 'desc')
  }
}

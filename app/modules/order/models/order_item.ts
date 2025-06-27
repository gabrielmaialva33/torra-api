import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import Order from '#modules/order/models/order'

export default class OrderItem extends BaseModel {
  static table = 'order_items'

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
  declare product_name: string

  @column()
  declare quantity: number

  @column()
  declare sku: string

  @column()
  declare price: number

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
  @belongsTo(() => Order, {
    foreignKey: 'order_id',
  })
  declare order: BelongsTo<typeof Order>

  /**
   * ------------------------------------------------------
   * Helpers
   * ------------------------------------------------------
   */
  get totalPrice(): number {
    return this.price * this.quantity
  }
}

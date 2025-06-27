import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'

import Store from '#modules/store/models/store'
import Order from '#modules/order/models/order'

export type LockerSize = 'P' | 'M' | 'G'
export type LockerStatus = 'available' | 'occupied' | 'maintenance'

export default class Locker extends BaseModel {
  static table = 'lockers'

  /**
   * ------------------------------------------------------
   * Columns
   * ------------------------------------------------------
   */
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare store_id: number

  @column()
  declare code: string

  @column()
  declare size: LockerSize

  @column()
  declare status: LockerStatus

  @column()
  declare current_order_id: number | null

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
  @belongsTo(() => Store, {
    foreignKey: 'store_id',
  })
  declare store: BelongsTo<typeof Store>

  @hasOne(() => Order, {
    foreignKey: 'locker_id',
  })
  declare currentOrder: HasOne<typeof Order>

  /**
   * ------------------------------------------------------
   * Helpers
   * ------------------------------------------------------
   */
  get isAvailable(): boolean {
    return this.status === 'available'
  }

  get isOccupied(): boolean {
    return this.status === 'occupied'
  }

  get isInMaintenance(): boolean {
    return this.status === 'maintenance'
  }

  get sizeLabel(): string {
    const labels = {
      P: 'Pequeno',
      M: 'Médio',
      G: 'Grande',
    }
    return labels[this.size]
  }

  /**
   * ------------------------------------------------------
   * Query Scopes
   * ------------------------------------------------------
   */
  static available = (query: any) => {
    return query.where('status', 'available')
  }

  static occupied = (query: any) => {
    return query.where('status', 'occupied')
  }

  static maintenance = (query: any) => {
    return query.where('status', 'maintenance')
  }

  static byStore = (query: any, storeId: number) => {
    return query.where('store_id', storeId)
  }

  static bySize = (query: any, size: LockerSize) => {
    return query.where('size', size)
  }

  static byCode = (query: any, code: string) => {
    return query.where('code', code)
  }
}

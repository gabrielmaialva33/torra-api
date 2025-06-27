import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

import User from '#modules/user/models/user'
import Locker from '#modules/locker/models/locker'
import Order from '#modules/order/models/order'

export default class Store extends BaseModel {
  static table = 'stores'

  /**
   * ------------------------------------------------------
   * Columns
   * ------------------------------------------------------
   */
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare code: string

  @column()
  declare address: {
    street: string
    number: string
    complement?: string | null
    neighborhood: string
    city: string
    state: string
    zip_code: string
  }

  @column()
  declare phone: string

  @column()
  declare email: string

  @column()
  declare is_active: boolean

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
  @manyToMany(() => User, {
    pivotTable: 'user_stores',
    pivotColumns: ['role', 'is_active'],
    pivotTimestamps: true,
  })
  declare users: ManyToMany<typeof User>

  @hasMany(() => Locker, {
    foreignKey: 'store_id',
  })
  declare lockers: HasMany<typeof Locker>

  @hasMany(() => Order, {
    foreignKey: 'store_id',
  })
  declare orders: HasMany<typeof Order>

  /**
   * ------------------------------------------------------
   * Query Scopes
   * ------------------------------------------------------
   */
  static active = (query: any) => {
    return query.where('is_active', true)
  }

  static byCode = (query: any, code: string) => {
    return query.where('code', code)
  }
}

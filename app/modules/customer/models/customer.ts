import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import Order from '#modules/order/models/order'

export default class Customer extends BaseModel {
  static table = 'customers'

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
  declare cpf: string

  @column()
  declare email: string

  @column()
  declare phone: string

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
  @hasMany(() => Order, {
    foreignKey: 'customer_id',
  })
  declare orders: HasMany<typeof Order>

  /**
   * ------------------------------------------------------
   * Helpers
   * ------------------------------------------------------
   */
  get formattedCpf(): string {
    return this.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  get formattedPhone(): string {
    const phone = this.phone.replace(/\D/g, '')
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  /**
   * ------------------------------------------------------
   * Query Scopes
   * ------------------------------------------------------
   */
  static byCpf = (query: any, cpf: string) => {
    return query.where('cpf', cpf)
  }

  static byEmail = (query: any, email: string) => {
    return query.where('email', email)
  }

  static byPhone = (query: any, phone: string) => {
    return query.where('phone', phone)
  }
}

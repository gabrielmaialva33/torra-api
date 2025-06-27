import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.string('order_number', 50).notNullable().unique()

      table
        .integer('customer_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('RESTRICT')

      table
        .integer('store_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('stores')
        .onDelete('RESTRICT')

      table
        .integer('locker_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('lockers')
        .onDelete('SET NULL')

      table
        .enum('status', [
          'sent',
          'received',
          'awaiting_storage',
          'stored',
          'awaiting_retrieval',
          'retrieved',
          'cancellation_pending',
          'cancelled',
          'expired',
        ])
        .notNullable()
        .defaultTo('sent')

      table.timestamp('sent_at').notNullable()
      table.timestamp('received_at').nullable()
      table.timestamp('stored_at').nullable()
      table.timestamp('retrieved_at').nullable()
      table.timestamp('cancelled_at').nullable()
      table.timestamp('expiration_date').notNullable()

      table.string('retrieval_code', 10).nullable()
      table.text('cancellation_reason').nullable()
      table.jsonb('metadata').defaultTo('{}').comment('Additional order data')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      table.index(['order_number'])
      table.index(['customer_id'])
      table.index(['store_id'])
      table.index(['locker_id'])
      table.index(['status'])
      table.index(['expiration_date'])
      table.index(['retrieval_code'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

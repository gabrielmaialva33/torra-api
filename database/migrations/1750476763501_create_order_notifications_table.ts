import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('order_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('orders')
        .onDelete('CASCADE')

      table.enum('type', ['whatsapp', 'sms', 'email']).notNullable()
      table.enum('status', ['pending', 'sent', 'failed']).notNullable().defaultTo('pending')
      table.timestamp('sent_at').nullable()
      table.text('content').notNullable()
      table.jsonb('metadata').defaultTo('{}').comment('Response data, error messages, etc')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      table.index(['order_id'])
      table.index(['type'])
      table.index(['status'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

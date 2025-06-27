import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_status_histories'

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

      table.string('from_status', 50).nullable()
      table.string('to_status', 50).notNullable()

      table
        .integer('changed_by')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')

      table.text('reason').nullable()
      table.jsonb('metadata').defaultTo('{}').comment('Additional context data')

      table.timestamp('created_at').notNullable().defaultTo(this.now())

      table.index(['order_id'])
      table.index(['changed_by'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

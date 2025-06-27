import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_items'

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

      table.string('product_name', 255).notNullable()
      table.integer('quantity').notNullable().defaultTo(1)
      table.decimal('price', 10, 2).notNullable().defaultTo(0).comment('Price per item')
      table.string('sku', 100).nullable()
      table.jsonb('metadata').defaultTo('{}').comment('Additional item data')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      table.index(['order_id'])
      table.index(['sku'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

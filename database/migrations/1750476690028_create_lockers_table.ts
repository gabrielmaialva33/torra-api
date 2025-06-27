import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lockers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('store_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('stores')
        .onDelete('CASCADE')

      table.string('code', 50).notNullable()
      table.enum('size', ['P', 'M', 'G']).notNullable()
      table
        .enum('status', ['available', 'occupied', 'maintenance'])
        .notNullable()
        .defaultTo('available')

      table.integer('current_order_id').unsigned().nullable()

      table.jsonb('metadata').defaultTo('{}').comment('Additional locker data')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      table.index(['store_id'])
      table.index(['code'])
      table.index(['status'])
      table.unique(['store_id', 'code'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

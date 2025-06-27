import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'lockers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.foreign('current_order_id').references('id').inTable('orders').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['current_order_id'])
    })
  }
}

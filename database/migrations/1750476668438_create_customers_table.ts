import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.string('name', 255).notNullable()
      table.string('cpf', 11).notNullable().unique()
      table.string('email', 254).notNullable()
      table.string('phone', 20).notNullable()
      table.jsonb('metadata').defaultTo('{}').comment('Additional customer data')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      table.index(['cpf'])
      table.index(['email'])
      table.index(['phone'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

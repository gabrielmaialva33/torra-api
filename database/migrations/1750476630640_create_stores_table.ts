import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stores'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table.string('name', 255).notNullable()
      table.string('code', 50).notNullable().unique()
      table.jsonb('address').notNullable().comment('Store address details')
      table.string('phone', 20).notNullable()
      table.string('email', 254).notNullable()
      table.boolean('is_active').defaultTo(true)
      table.jsonb('metadata').defaultTo('{}').comment('Additional store data')

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').nullable()

      table.index(['code'])
      table.index(['is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

import Role from '#modules/role/models/role'
import IRole from '#modules/role/interfaces/role_interface'

export default class extends BaseSchema {
  async up() {
    // Create new roles for the Click & Collect system
    const roles = [
      {
        name: 'Store Manager',
        description: 'Full access to store operations, reports, and staff management',
        slug: IRole.Slugs.STORE_MANAGER,
      },
      {
        name: 'Store Operator',
        description: 'Access to receive orders, manage lockers, and handle customer pickups',
        slug: IRole.Slugs.STORE_OPERATOR,
      },
    ]

    for (const roleData of roles) {
      const existingRole = await Role.findBy('slug', roleData.slug)
      if (!existingRole) {
        await Role.create(roleData)
      }
    }
  }

  async down() {
    // Remove the store-specific roles
    await Role.query().whereIn('slug', ['store_manager', 'store_operator']).delete()
  }
}

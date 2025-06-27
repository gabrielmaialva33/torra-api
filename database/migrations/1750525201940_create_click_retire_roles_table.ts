import { BaseSchema } from '@adonisjs/lucid/schema'
import Role from '#modules/role/models/role'
import Permission from '#modules/permission/models/permission'
import IRole from '#modules/role/interfaces/role_interface'

export default class extends BaseSchema {
  async up() {
    // Create Store Manager role
    const storeManager = await Role.create({
      name: 'Store Manager',
      description: 'Manager of a specific store with full control over store operations',
      slug: IRole.Slugs.STORE_MANAGER,
    })

    // Create Store Operator role
    const storeOperator = await Role.create({
      name: 'Store Operator',
      description: 'Operator who can handle daily store operations',
      slug: IRole.Slugs.STORE_OPERATOR,
    })

    // Assign permissions to Store Manager
    const managerPermissions = await Permission.query()
      .whereIn('resource', ['stores', 'lockers', 'orders', 'customers', 'notifications'])
      .whereNotIn('action', ['create', 'delete']) // Managers can't create/delete stores
      .orWhere((query) => {
        query
          .whereIn('resource', ['lockers', 'orders', 'customers', 'notifications'])
          .whereIn('action', [
            'create',
            'read',
            'update',
            'delete',
            'list',
            'receive',
            'store',
            'retrieve',
            'cancel',
            'send',
            'maintenance',
          ])
      })

    await storeManager.related('permissions').sync(managerPermissions.map((p) => p.id))

    // Assign permissions to Store Operator
    const operatorPermissions = await Permission.query()
      .whereIn('resource', ['orders', 'customers', 'lockers'])
      .whereIn('action', ['read', 'list', 'receive', 'store', 'retrieve'])
      .orWhere((query) => {
        query.where('resource', 'notifications').where('action', 'send')
      })

    await storeOperator.related('permissions').sync(operatorPermissions.map((p) => p.id))

    // Add all store permissions to ADMIN role
    const adminRole = await Role.findBy('slug', 'admin')
    if (adminRole) {
      const allStorePermissions = await Permission.query().whereIn('resource', [
        'stores',
        'lockers',
        'orders',
        'customers',
        'notifications',
      ])

      const currentPermissions = await adminRole.related('permissions').query().select('id')
      const currentIds = currentPermissions.map((p) => p.id)
      const newIds = allStorePermissions.map((p) => p.id)

      await adminRole.related('permissions').sync([...currentIds, ...newIds])
    }
  }

  async down() {
    // Delete the roles
    await Role.query()
      .whereIn('slug', [IRole.Slugs.STORE_MANAGER, IRole.Slugs.STORE_OPERATOR])
      .delete()
  }
}

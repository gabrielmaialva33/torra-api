import { BaseSchema } from '@adonisjs/lucid/schema'

import Permission from '#modules/permission/models/permission'
import Role from '#modules/role/models/role'

export default class extends BaseSchema {
  async up() {
    // Define permissions for the Click & Collect system
    const permissions = [
      // Store permissions
      { resource: 'stores', action: 'create', description: 'Create new stores' },
      { resource: 'stores', action: 'read', description: 'View store details' },
      { resource: 'stores', action: 'update', description: 'Update store information' },
      { resource: 'stores', action: 'delete', description: 'Delete stores' },
      { resource: 'stores', action: 'list', description: 'List all stores' },
      { resource: 'stores', action: 'assign', description: 'Assign users to stores' },

      // Locker permissions
      { resource: 'lockers', action: 'create', description: 'Create new lockers' },
      { resource: 'lockers', action: 'read', description: 'View locker details' },
      { resource: 'lockers', action: 'update', description: 'Update locker status' },
      { resource: 'lockers', action: 'delete', description: 'Delete lockers' },
      { resource: 'lockers', action: 'list', description: 'List all lockers' },
      { resource: 'lockers', action: 'assign', description: 'Assign orders to lockers' },

      // Order permissions
      { resource: 'orders', action: 'create', description: 'Create new orders' },
      { resource: 'orders', action: 'read', description: 'View order details' },
      { resource: 'orders', action: 'update', description: 'Update order status' },
      { resource: 'orders', action: 'delete', description: 'Delete orders' },
      { resource: 'orders', action: 'list', description: 'List all orders' },
      { resource: 'orders', action: 'receive', description: 'Receive orders at store' },
      { resource: 'orders', action: 'store', description: 'Store orders in lockers' },
      { resource: 'orders', action: 'retrieve', description: 'Handle order retrieval' },
      { resource: 'orders', action: 'cancel', description: 'Cancel orders' },

      // Customer permissions
      { resource: 'customers', action: 'create', description: 'Create new customers' },
      { resource: 'customers', action: 'read', description: 'View customer details' },
      { resource: 'customers', action: 'update', description: 'Update customer information' },
      { resource: 'customers', action: 'delete', description: 'Delete customers' },
      { resource: 'customers', action: 'list', description: 'List all customers' },

      // Notification permissions
      { resource: 'notifications', action: 'create', description: 'Send notifications' },
      { resource: 'notifications', action: 'read', description: 'View notification history' },
      { resource: 'notifications', action: 'list', description: 'List all notifications' },
    ]

    // Create permissions
    for (const permData of permissions) {
      const existingPerm = await Permission.query()
        .where('resource', permData.resource)
        .where('action', permData.action)
        .where('context', 'any')
        .first()

      if (!existingPerm) {
        await Permission.create({
          ...permData,
          context: 'any',
          name: `${permData.resource}.${permData.action}.any`,
        })
      }
    }

    // Assign permissions to roles
    const adminRole = await Role.findBy('slug', 'admin')
    const storeManagerRole = await Role.findBy('slug', 'store_manager')
    const storeOperatorRole = await Role.findBy('slug', 'store_operator')

    if (adminRole) {
      // Admin gets all permissions
      const allPermissions = await Permission.query().whereIn('resource', [
        'stores',
        'lockers',
        'orders',
        'customers',
        'notifications',
      ])
      await adminRole.related('permissions').sync(allPermissions.map((p) => p.id))
    }

    if (storeManagerRole) {
      // Store Manager gets most permissions except system-wide create/delete
      const managerPermissions = await Permission.query()
        .whereIn('resource', ['stores', 'lockers', 'orders', 'customers', 'notifications'])
        .whereNotIn('action', ['create', 'delete'])
        .orWhere((query) => {
          query.where('resource', 'lockers').whereIn('action', ['create', 'update', 'delete'])
        })
      await storeManagerRole.related('permissions').sync(managerPermissions.map((p) => p.id))
    }

    if (storeOperatorRole) {
      // Store Operator gets operational permissions
      const operatorPermissions = await Permission.query()
        .where((query) => {
          query
            .where('resource', 'orders')
            .whereIn('action', ['read', 'list', 'receive', 'store', 'retrieve'])
        })
        .orWhere((query) => {
          query.where('resource', 'lockers').whereIn('action', ['read', 'list', 'update'])
        })
        .orWhere((query) => {
          query.where('resource', 'customers').whereIn('action', ['read', 'list'])
        })
        .orWhere((query) => {
          query.where('resource', 'notifications').whereIn('action', ['create'])
        })
      await storeOperatorRole.related('permissions').sync(operatorPermissions.map((p) => p.id))
    }
  }

  async down() {
    // Remove Click & Collect permissions
    await Permission.query()
      .whereIn('resource', ['stores', 'lockers', 'orders', 'customers', 'notifications'])
      .delete()
  }
}

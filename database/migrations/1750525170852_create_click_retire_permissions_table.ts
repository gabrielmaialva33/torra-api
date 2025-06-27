import { BaseSchema } from '@adonisjs/lucid/schema'
import app from '@adonisjs/core/services/app'
import PermissionRepository from '#modules/permission/repositories/permission_repository'

export default class extends BaseSchema {
  async up() {
    const repository = await app.container.make(PermissionRepository)

    // Store permissions
    await repository.syncPermissions([
      {
        name: 'stores.create',
        resource: 'stores',
        action: 'create',
        description: 'Create new stores',
      },
      {
        name: 'stores.read',
        resource: 'stores',
        action: 'read',
        description: 'View store details',
      },
      {
        name: 'stores.update',
        resource: 'stores',
        action: 'update',
        description: 'Update store information',
      },
      {
        name: 'stores.delete',
        resource: 'stores',
        action: 'delete',
        description: 'Delete stores',
      },
      {
        name: 'stores.list',
        resource: 'stores',
        action: 'list',
        description: 'List stores',
      },
      {
        name: 'stores.assign',
        resource: 'stores',
        action: 'assign',
        description: 'Assign users to stores',
      },
    ])

    // Locker permissions
    await repository.syncPermissions([
      {
        name: 'lockers.create',
        resource: 'lockers',
        action: 'create',
        description: 'Create new lockers',
      },
      {
        name: 'lockers.read',
        resource: 'lockers',
        action: 'read',
        description: 'View locker details',
      },
      {
        name: 'lockers.update',
        resource: 'lockers',
        action: 'update',
        description: 'Update locker information',
      },
      {
        name: 'lockers.delete',
        resource: 'lockers',
        action: 'delete',
        description: 'Delete lockers',
      },
      {
        name: 'lockers.list',
        resource: 'lockers',
        action: 'list',
        description: 'List lockers',
      },
      {
        name: 'lockers.maintenance',
        resource: 'lockers',
        action: 'maintenance',
        description: 'Set locker maintenance status',
      },
    ])

    // Order permissions
    await repository.syncPermissions([
      {
        name: 'orders.create',
        resource: 'orders',
        action: 'create',
        description: 'Create new orders',
      },
      {
        name: 'orders.read',
        resource: 'orders',
        action: 'read',
        description: 'View order details',
      },
      {
        name: 'orders.update',
        resource: 'orders',
        action: 'update',
        description: 'Update order information',
      },
      {
        name: 'orders.delete',
        resource: 'orders',
        action: 'delete',
        description: 'Delete orders',
      },
      {
        name: 'orders.list',
        resource: 'orders',
        action: 'list',
        description: 'List orders',
      },
      {
        name: 'orders.receive',
        resource: 'orders',
        action: 'receive',
        description: 'Mark orders as received',
      },
      {
        name: 'orders.store',
        resource: 'orders',
        action: 'store',
        description: 'Store orders in lockers',
      },
      {
        name: 'orders.retrieve',
        resource: 'orders',
        action: 'retrieve',
        description: 'Process order retrieval',
      },
      {
        name: 'orders.cancel',
        resource: 'orders',
        action: 'cancel',
        description: 'Cancel orders',
      },
    ])

    // Customer permissions
    await repository.syncPermissions([
      {
        name: 'customers.create',
        resource: 'customers',
        action: 'create',
        description: 'Create new customers',
      },
      {
        name: 'customers.read',
        resource: 'customers',
        action: 'read',
        description: 'View customer details',
      },
      {
        name: 'customers.update',
        resource: 'customers',
        action: 'update',
        description: 'Update customer information',
      },
      {
        name: 'customers.delete',
        resource: 'customers',
        action: 'delete',
        description: 'Delete customers',
      },
      {
        name: 'customers.list',
        resource: 'customers',
        action: 'list',
        description: 'List customers',
      },
    ])

    // Notification permissions
    await repository.syncPermissions([
      {
        name: 'notifications.send',
        resource: 'notifications',
        action: 'send',
        description: 'Send notifications',
      },
      {
        name: 'notifications.list',
        resource: 'notifications',
        action: 'list',
        description: 'List notifications',
      },
    ])
  }

  async down() {
    this.schema.raw(`
      DELETE
      FROM permissions
      WHERE resource IN ('stores', 'lockers', 'orders', 'customers', 'notifications')
    `)
  }
}

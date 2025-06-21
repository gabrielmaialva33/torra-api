import Factory from '@adonisjs/lucid/factories'

import User from '#modules/user/models/user'
import Role from '#modules/role/models/role'
import { StoreFactory } from '#database/factories/store_factory'

export const UserFactory = Factory.define(User, ({ faker }) => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  const username = faker.internet.username({ firstName, lastName }).toLowerCase()

  return {
    full_name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }),
    username,
    password: 'password123', // Will be hashed by the model hook
    is_deleted: false,
    metadata: {
      email_verified: faker.datatype.boolean({ probability: 0.8 }),
      email_verification_token: null,
      email_verification_sent_at: null,
      email_verified_at: faker.datatype.boolean({ probability: 0.8 })
        ? faker.date.past().toISOString()
        : null,
    },
  }
})
  .state('verified', (user, { faker }) => {
    user.metadata = {
      email_verified: true,
      email_verification_token: null,
      email_verification_sent_at: null,
      email_verified_at: faker.date.past().toISOString(),
    }
  })
  .state('unverified', (user, { faker }) => {
    user.metadata = {
      email_verified: false,
      email_verification_token: faker.string.alphanumeric(32),
      email_verification_sent_at: faker.date.recent().toISOString(),
      email_verified_at: null,
    }
  })
  .state('deleted', (user) => {
    user.is_deleted = true
  })
  .state('storeManager', (user, { faker }) => {
    user.metadata = {
      ...user.metadata,
      employee_id: faker.string.numeric(6),
      department: 'Store Operations',
      position: 'Store Manager',
    }
  })
  .state('storeOperator', (user, { faker }) => {
    user.metadata = {
      ...user.metadata,
      employee_id: faker.string.numeric(6),
      department: 'Store Operations',
      position: 'Store Operator',
    }
  })
  .state('admin', (user, { faker }) => {
    user.metadata = {
      ...user.metadata,
      is_system_admin: true,
      admin_since: faker.date.past({ years: 2 }).toISOString(),
    }
  })
  .relation('stores', () => StoreFactory)
  .after('create', async (_factory, user) => {
    // The model hook already assigns the default USER role
    // Add store roles if using store states
    if (user.metadata?.position === 'Store Manager') {
      const managerRole = await Role.findBy('slug', 'store_manager')
      if (managerRole) {
        await user.related('roles').attach([managerRole.id])
      }
    } else if (user.metadata?.position === 'Store Operator') {
      const operatorRole = await Role.findBy('slug', 'store_operator')
      if (operatorRole) {
        await user.related('roles').attach([operatorRole.id])
      }
    }
  })
  .build()

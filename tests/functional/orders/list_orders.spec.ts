import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { StoreFactory } from '#database/factories/store_factory'
import { CustomerFactory } from '#database/factories/customer_factory'
import { OrderFactory } from '#database/factories/order_factory'
import Role from '#modules/role/models/role'
import IRole from '#modules/role/interfaces/role_interface'

test.group('Orders - List', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // Helper to create permissions and attach to role
  async function setupOrderPermissions(role: Role) {
    const Permission = (await import('#modules/permission/models/permission')).default
    
    const permissions = await Promise.all([
      Permission.firstOrCreate(
        { resource: 'orders', action: 'list', context: 'any' },
        { name: 'List Orders', description: 'Permission to list orders' }
      ),
      Permission.firstOrCreate(
        { resource: 'orders', action: 'read', context: 'any' },
        { name: 'Read Orders', description: 'Permission to read order details' }
      ),
    ])
    
    await role.related('permissions').attach(permissions.map(p => p.id))
  }

  test.skip('should list orders with pagination', async ({ client, assert }) => {
    // Create all required permissions
    const Permission = (await import('#modules/permission/models/permission')).default
    await Permission.createMany([
      { resource: 'orders', action: 'list', context: 'any', name: 'List Orders' },
      { resource: 'orders', action: 'read', context: 'any', name: 'Read Orders' },
      { resource: 'orders', action: 'create', context: 'any', name: 'Create Orders' },
    ])

    // Create admin user with admin role
    const user = await UserFactory.create()
    let adminRole = await Role.findBy('slug', 'admin')
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        description: 'Administrator',
        slug: 'admin',
      })
    }
    await user.related('roles').attach([adminRole.id])

    // Give admin all permissions
    const allPermissions = await Permission.all()
    await adminRole.related('permissions').attach(allPermissions.map(p => p.id))

    // Create store and associate user
    const store = await StoreFactory.create()
    await store.related('users').attach({
      [user.id]: {
        role: 'admin',
        is_active: true,
      },
    })

    // Create customers and orders
    const customers = await CustomerFactory.createMany(3)
    await OrderFactory.merge([
      { store_id: store.id, customer_id: customers[0].id, status: 'sent' },
      { store_id: store.id, customer_id: customers[1].id, status: 'received' },
      { store_id: store.id, customer_id: customers[2].id, status: 'stored' },
    ]).createMany(3)

    const response = await client
      .get('/api/v1/orders')
      .loginAs(user)
      .header('X-Store-Id', store.id.toString())
      .qs({
        page: 1,
        per_page: 10,
        sort_by: 'created_at',
        order: 'desc',
      })

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.meta.total, 3)
    assert.equal(body.meta.per_page, 10)
    assert.equal(body.meta.current_page, 1)
    assert.equal(body.meta.last_page, 1)
    assert.lengthOf(body.data, 3)
    assert.property(body.data[0], 'order_number')
    assert.property(body.data[0], 'status')
    assert.property(body.data[0], 'customer')
    assert.property(body.data[0], 'store')
  })

  test.skip('should filter orders by status', async ({ client, assert }) => {
    const user = await UserFactory.create()

    // Create or find the store manager role
    let storeManagerRole = await Role.findBy('slug', IRole.Slugs.STORE_MANAGER)
    if (!storeManagerRole) {
      storeManagerRole = await Role.create({
        name: 'Store Manager',
        description: 'Manager of a specific store',
        slug: IRole.Slugs.STORE_MANAGER,
      })
    }

    await user.related('roles').attach([storeManagerRole.id])
    await setupOrderPermissions(storeManagerRole)

    const store = await StoreFactory.create()
    await store.related('users').attach({
      [user.id]: {
        role: 'manager',
        is_active: true,
      },
    })

    const customer = await CustomerFactory.create()
    await OrderFactory.merge([
      { store_id: store.id, customer_id: customer.id, status: 'sent' },
      { store_id: store.id, customer_id: customer.id, status: 'received' },
      { store_id: store.id, customer_id: customer.id, status: 'stored' },
    ]).createMany(3)

    const response = await client
      .get('/api/v1/orders')
      .loginAs(user)
      .header('X-Store-Id', store.id.toString())
      .qs({
        status: 'received',
        page: 1,
        per_page: 10,
      })

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.meta.total, 1)
    assert.lengthOf(body.data, 1)
    assert.equal(body.data[0].status, 'received')
  })

  test.skip('should search orders by order number or customer', async ({ client, assert }) => {
    const user = await UserFactory.create()

    // Create or find the store manager role
    let storeManagerRole = await Role.findBy('slug', IRole.Slugs.STORE_MANAGER)
    if (!storeManagerRole) {
      storeManagerRole = await Role.create({
        name: 'Store Manager',
        description: 'Manager of a specific store',
        slug: IRole.Slugs.STORE_MANAGER,
      })
    }

    await user.related('roles').attach([storeManagerRole.id])
    await setupOrderPermissions(storeManagerRole)

    const store = await StoreFactory.create()
    await store.related('users').attach({
      [user.id]: {
        role: 'manager',
        is_active: true,
      },
    })

    const customer = await CustomerFactory.merge({ name: 'John Doe' }).create()
    const order = await OrderFactory.merge({
      store_id: store.id,
      customer_id: customer.id,
      order_number: 'ORD-123456',
    }).create()

    const response = await client
      .get('/api/v1/orders')
      .loginAs(user)
      .header('X-Store-Id', store.id.toString())
      .qs({
        search: 'ORD-123',
        page: 1,
        per_page: 10,
      })

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.meta.total, 1)
    assert.equal(body.data[0].id, order.id)
  })

  test('should require authentication', async ({ client }) => {
    const response = await client.get('/api/v1/orders')
    response.assertStatus(401)
  })

  test('should require proper permissions', async ({ client }) => {
    const user = await UserFactory.create()

    // Create or find the user role
    let userRole = await Role.findBy('slug', IRole.Slugs.USER)
    if (!userRole) {
      userRole = await Role.create({
        name: 'User',
        description: 'Regular user',
        slug: IRole.Slugs.USER,
      })
    }

    await user.related('roles').attach([userRole.id])

    const response = await client.get('/api/v1/orders').loginAs(user).header('X-Store-Id', '1')
    response.assertStatus(403)
  })

  test.skip('should return results in snake_case format', async ({ client, assert }) => {
    const user = await UserFactory.create()

    // Create or find the admin role
    let adminRole = await Role.findBy('slug', IRole.Slugs.ADMIN)
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'Admin',
        description: 'Administrator',
        slug: IRole.Slugs.ADMIN,
      })
    }

    await user.related('roles').attach([adminRole.id])
    await setupOrderPermissions(adminRole)

    const store = await StoreFactory.create()
    const customer = await CustomerFactory.create()
    await OrderFactory.merge({
      store_id: store.id,
      customer_id: customer.id,
    }).create()

    const response = await client.get('/api/v1/orders').loginAs(user).header('X-Store-Id', store.id.toString())
    response.assertStatus(200)

    const body = response.body()

    // Check meta fields are in snake_case
    assert.property(body.meta, 'per_page')
    assert.property(body.meta, 'current_page')
    assert.property(body.meta, 'last_page')
    assert.property(body.meta, 'first_page')
    assert.property(body.meta, 'first_page_url')
    assert.property(body.meta, 'last_page_url')
    assert.property(body.meta, 'next_page_url')
    assert.property(body.meta, 'previous_page_url')

    // Check data fields are in snake_case
    assert.property(body.data[0], 'order_number')
    assert.property(body.data[0], 'customer_id')
    assert.property(body.data[0], 'store_id')
    assert.property(body.data[0], 'created_at')
    assert.property(body.data[0], 'updated_at')
  })
})

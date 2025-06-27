import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Role from '#modules/role/models/role'
import { StoreFactory } from '#database/factories/store_factory'
import { UserFactory } from '#database/factories/user_factory'
import { LockerFactory } from '#database/factories/locker_factory'
import { CustomerFactory } from '#database/factories/customer_factory'
import { OrderFactory } from '#database/factories/order_factory'
import Locker from '#modules/locker/models/locker'

export default class extends BaseSeeder {
  async run() {
    // Ensure roles exist
    const storeManagerRole = await Role.findBy('slug', 'store_manager')
    const storeOperatorRole = await Role.findBy('slug', 'store_operator')

    if (!storeManagerRole || !storeOperatorRole) {
      console.error('Store roles not found. Please run role migrations first.')
      return
    }

    // Create stores with different configurations
    const stores = await StoreFactory.merge([
      {
        name: 'Loja Centro SP',
        code: 'LJ001',
        address: {
          street: 'Rua 25 de Março',
          number: '1000',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01021100',
        },
      },
      {
        name: 'Loja Shopping Iguatemi',
        code: 'LJ002',
        address: {
          street: 'Av. Brigadeiro Faria Lima',
          number: '2232',
          complement: 'Loja 123',
          neighborhood: 'Jardim Paulistano',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01452000',
        },
      },
      {
        name: 'Loja Copacabana',
        code: 'LJ003',
        address: {
          street: 'Av. Nossa Senhora de Copacabana',
          number: '500',
          neighborhood: 'Copacabana',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zip_code: '22020001',
        },
      },
    ]).createMany(3)

    // Create store managers
    const managers = await Promise.all(
      stores.map(async (store, index) => {
        const manager = await UserFactory.merge({
          full_name: `Gerente Loja ${index + 1}`,
          email: `gerente.loja${index + 1}@lojastorra.com.br`,
          username: `gerente_lj${store.code.toLowerCase()}`,
        })
          .apply('verified')
          .apply('storeManager')
          .create()

        // Assign manager role and store
        await manager.related('roles').sync([storeManagerRole.id])
        await manager.related('stores').attach({
          [store.id]: { role: 'manager', is_active: true },
        })

        return manager
      })
    )

    // Create store operators (2 per store)
    const operators = await Promise.all(
      stores.flatMap((store, storeIndex) =>
        [1, 2].map(async (opIndex) => {
          const operator = await UserFactory.merge({
            full_name: `Operador ${opIndex} Loja ${storeIndex + 1}`,
            email: `operador${opIndex}.loja${storeIndex + 1}@lojastorra.com.br`,
            username: `op${opIndex}_lj${store.code.toLowerCase()}`,
          })
            .apply('verified')
            .apply('storeOperator')
            .create()

          // Assign operator role and store
          await operator.related('roles').sync([storeOperatorRole.id])
          await operator.related('stores').attach({
            [store.id]: { role: 'operator', is_active: true },
          })

          return operator
        })
      )
    )

    // Create lockers for each store
    for (const store of stores) {
      // Small lockers (10)
      await LockerFactory.merge(
        Array.from({ length: 10 }, (_, i) => ({
          store_id: store.id,
          code: `A${(i + 1).toString().padStart(2, '0')}`,
          size: 'P' as const,
        }))
      ).createMany(10)

      // Medium lockers (6)
      await LockerFactory.merge(
        Array.from({ length: 6 }, (_, i) => ({
          store_id: store.id,
          code: `B${(i + 1).toString().padStart(2, '0')}`,
          size: 'M' as const,
        }))
      ).createMany(6)

      // Large lockers (4)
      await LockerFactory.merge(
        Array.from({ length: 4 }, (_, i) => ({
          store_id: store.id,
          code: `C${(i + 1).toString().padStart(2, '0')}`,
          size: 'G' as const,
        }))
      ).createMany(4)

      // Set some lockers to maintenance
      await LockerFactory.merge({ store_id: store.id }).apply('maintenance').createMany(2)
    }

    // Create customers
    const customers = await CustomerFactory.merge([
      { name: 'João Silva', cpf: '11122233344' },
      { name: 'Maria Santos', cpf: '22233344455' },
      { name: 'Pedro Oliveira', cpf: '33344455566' },
    ])
      .apply('corporate')
      .createMany(10)

    // Create VIP customers
    const vipCustomers = await CustomerFactory.apply('vip').createMany(3)

    // Create corporate customers
    const corporateCustomers = await CustomerFactory.apply('corporate').createMany(2)

    const allCustomers = [...customers, ...vipCustomers, ...corporateCustomers]

    // Create orders with different statuses
    for (const store of stores) {
      // Orders sent (awaiting arrival)
      await OrderFactory.merge({
        store_id: store.id,
        customer_id: allCustomers[Math.floor(Math.random() * allCustomers.length)].id,
      })
        .with('items', 3)
        .createMany(5)

      // Orders received
      await OrderFactory.merge({
        store_id: store.id,
        customer_id: allCustomers[Math.floor(Math.random() * allCustomers.length)].id,
      })
        .apply('received')
        .with('items', 2)
        .with('statusHistory', 2)
        .createMany(3)

      // Orders awaiting storage
      await OrderFactory.merge({
        store_id: store.id,
        customer_id: allCustomers[Math.floor(Math.random() * allCustomers.length)].id,
      })
        .apply('awaiting_storage')
        .with('items', 2)
        .with('statusHistory', 3)
        .createMany(2)

      // Orders stored (ready for pickup)
      const storedOrders = await OrderFactory.merge({
        store_id: store.id,
        customer_id: allCustomers[Math.floor(Math.random() * allCustomers.length)].id,
      })
        .apply('stored')
        .with('items', 2)
        .with('notifications', 2, (notification) => {
          notification.apply('whatsapp').apply('sent')
        })
        .with('statusHistory', 4)
        .createMany(8)

      // Assign lockers to stored orders
      const availableLockers = await Locker.query()
        .where('store_id', store.id)
        .where('status', 'available')
        .limit(storedOrders.length)

      for (let i = 0; i < storedOrders.length && i < availableLockers.length; i++) {
        const order = storedOrders[i]
        const locker = availableLockers[i]

        order.locker_id = locker.id
        await order.save()

        locker.status = 'occupied'
        locker.current_order_id = order.id
        await locker.save()
      }

      // Orders retrieved
      await OrderFactory.merge({
        store_id: store.id,
        customer_id: allCustomers[Math.floor(Math.random() * allCustomers.length)].id,
      })
        .apply('retrieved')
        .with('items', 3)
        .with('notifications', 3)
        .with('statusHistory', 6)
        .createMany(15)

      // Cancelled orders
      await OrderFactory.merge({
        store_id: store.id,
        customer_id: allCustomers[Math.floor(Math.random() * allCustomers.length)].id,
      })
        .apply('cancelled')
        .with('items', 1)
        .with('statusHistory', 3)
        .createMany(2)

      // Expired orders
      await OrderFactory.merge({
        store_id: store.id,
        customer_id: allCustomers[Math.floor(Math.random() * allCustomers.length)].id,
      })
        .apply('expired')
        .with('items', 2)
        .with('notifications', 4)
        .with('statusHistory', 5)
        .createMany(1)
    }

    // Create some urgent orders
    await OrderFactory.merge({
      store_id: stores[0].id,
      customer_id: vipCustomers[0].id,
    })
      .apply('stored')
      .apply('urgent')
      .with('items', 1)
      .with('notifications', 1)
      .createMany(2)

    console.log('✅ Click & Collect seeding completed!')
    console.log(`📍 Created ${stores.length} stores`)
    console.log(`👥 Created ${managers.length} managers and ${operators.length} operators`)
    console.log(`🧑 Created ${allCustomers.length} customers`)
    console.log(`📦 Created multiple orders with various statuses`)
  }
}

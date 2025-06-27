import Factory from '@adonisjs/lucid/factories'

import Store from '#modules/store/models/store'
import { LockerFactory } from '#database/factories/locker_factory'
import { OrderFactory } from '#database/factories/order_factory'

export const StoreFactory = Factory.define(Store, ({ faker }) => {
  const storeNumber = faker.number.int({ min: 100, max: 999 })
  const states = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'PA']

  return {
    name: `Loja ${faker.location.city()} - ${storeNumber}`,
    code: `LJ${storeNumber}`,
    address: {
      street: faker.location.street(),
      number: faker.location.buildingNumber(),
      complement: faker.helpers.maybe(() => faker.location.secondaryAddress(), {
        probability: 0.3,
      }),
      neighborhood: faker.location.county(),
      city: faker.location.city(),
      state: faker.helpers.arrayElement(states),
      zip_code: faker.location.zipCode('########'),
    },
    phone: faker.phone.number({
      style: 'international',
    }),
    email: faker.internet.email({
      firstName: `loja${storeNumber}`,
      provider: 'lojastorra.com.br',
    }),
    is_active: true,
    metadata: {
      opening_hours: {
        weekdays: '08:00-22:00',
        saturday: '09:00-20:00',
        sunday: '10:00-18:00',
      },
      has_parking: faker.datatype.boolean(),
      has_accessibility: true,
    },
  }
})
  .state('inactive', (store) => {
    store.is_active = false
  })
  .state('24hours', (store) => {
    store.metadata = {
      ...store.metadata,
      opening_hours: {
        weekdays: '00:00-23:59',
        saturday: '00:00-23:59',
        sunday: '00:00-23:59',
      },
      is_24_hours: true,
    }
  })
  .state('mall', (store, { faker }) => {
    store.name = `Loja Shopping ${faker.company.name()}`
    store.metadata = {
      ...store.metadata,
      location_type: 'shopping_mall',
      mall_name: `Shopping ${faker.company.name()}`,
      floor: faker.helpers.arrayElement(['Térreo', 'L1', 'L2', 'L3']),
    }
  })
  .relation('lockers', () => LockerFactory)
  .relation('orders', () => OrderFactory)
  .after('create', async (_factory, store) => {
    // Create default lockers for new stores if none exist
    if (!store.$preloaded?.lockers) {
      await LockerFactory.merge([
        { code: 'A01', size: 'P', store_id: store.id },
        { code: 'A02', size: 'P', store_id: store.id },
        { code: 'A03', size: 'P', store_id: store.id },
        { code: 'B01', size: 'M', store_id: store.id },
        { code: 'B02', size: 'M', store_id: store.id },
        { code: 'C01', size: 'G', store_id: store.id },
      ]).createMany(6)
    }
  })
  .build()

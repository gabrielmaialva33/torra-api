import factory from '@adonisjs/lucid/factories'

import type { LockerSize, LockerStatus } from '#modules/locker/models/locker'
import Locker from '#modules/locker/models/locker'

export const LockerFactory = factory
  .define(Locker, async ({ faker }) => {
    const section = faker.helpers.arrayElement(['A', 'B', 'C', 'D', 'E'])
    const number = faker.number.int({ min: 1, max: 50 })
    const size: LockerSize = faker.helpers.weightedArrayElement([
      { value: 'P', weight: 50 }, // 50% small
      { value: 'M', weight: 35 }, // 35% medium
      { value: 'G', weight: 15 }, // 15% large
    ]) as LockerSize

    const status: LockerStatus = faker.helpers.weightedArrayElement([
      { value: 'available', weight: 70 }, // 70% available
      { value: 'occupied', weight: 25 }, // 25% occupied
      { value: 'maintenance', weight: 5 }, // 5% maintenance
    ]) as LockerStatus

    return {
      code: `${section}${number.toString().padStart(2, '0')}`,
      size,
      status,
      metadata: {
        last_maintenance: faker.date.recent({ days: 180 }).toISOString(),
        usage_count: faker.number.int({ min: 0, max: 1000 }),
        notes:
          status === 'maintenance'
            ? faker.helpers.arrayElement([
                'Lock issue',
                'Cleaning required',
                'Door alignment',
                'Electronic failure',
              ])
            : null,
      },
    }
  })
  .state('available', (locker) => {
    locker.status = 'available'
    locker.current_order_id = null
  })
  .state('occupied', (locker) => {
    locker.status = 'occupied'
    // current_order_id will be set when creating orders
  })
  .state('maintenance', (locker) => {
    locker.status = 'maintenance'
    locker.current_order_id = null
    locker.metadata.notes = 'Scheduled maintenance'
  })
  .state('small', (locker) => {
    locker.size = 'P'
  })
  .state('medium', (locker) => {
    locker.size = 'M'
  })
  .state('large', (locker) => {
    locker.size = 'G'
  })
  .build()

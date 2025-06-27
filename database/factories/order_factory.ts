import { DateTime } from 'luxon'

import Factory from '@adonisjs/lucid/factories'
import string from '@adonisjs/core/helpers/string'

import Order, { OrderStatus } from '#modules/order/models/order'

import { CustomerFactory } from '#database/factories/customer_factory'
import { StoreFactory } from '#database/factories/store_factory'
import { LockerFactory } from '#database/factories/locker_factory'
import { OrderItemFactory } from '#database/factories/order_item_factory'
import { OrderNotificationFactory } from '#database/factories/order_notification_factory'
import { OrderStatusHistoryFactory } from '#database/factories/order_status_history_factory'

export const OrderFactory = Factory.define(Order, ({ faker }) => {
  const orderNumber = `PED${DateTime.now().toFormat('yyyyMMdd')}${faker.number.int({ min: 1000, max: 9999 })}`
  const sentAt = faker.date.recent({ days: 30 })

  return {
    order_number: orderNumber,
    customer_id: 1, // Will be overridden by a relationship
    store_id: 1, // Will be overridden by a relationship
    locker_id: null,
    status: 'sent' as OrderStatus,
    sent_at: DateTime.fromJSDate(sentAt),
    received_at: null,
    stored_at: null,
    retrieved_at: null,
    cancelled_at: null,
    expiration_date: DateTime.fromJSDate(sentAt).plus({ days: 30 }),
    retrieval_code: null,
    cancellation_reason: null,
    metadata: {
      source: faker.helpers.arrayElement(['website', 'app', 'call_center', 'partner']),
      shipping_method: faker.helpers.arrayElement(['express', 'standard', 'economy']),
      tracking_code: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
      estimated_delivery: DateTime.fromJSDate(sentAt)
        .plus({ days: faker.number.int({ min: 1, max: 5 }) })
        .toISO(),
    },
  }
})
  .state('received', (order, { faker }) => {
    order.status = 'received'
    order.received_at = DateTime.fromJSDate(order.sent_at.toJSDate()).plus({
      days: faker.number.int({ min: 1, max: 3 }),
    })
  })
  .state('awaiting_storage', (order, { faker }) => {
    order.status = 'awaiting_storage'
    const receivedAt = DateTime.fromJSDate(order.sent_at.toJSDate()).plus({
      days: faker.number.int({ min: 1, max: 3 }),
    })
    order.received_at = receivedAt
  })
  .state('stored', (order, { faker }) => {
    order.status = 'stored'
    const receivedAt = DateTime.fromJSDate(order.sent_at.toJSDate()).plus({
      days: faker.number.int({ min: 1, max: 3 }),
    })
    order.received_at = receivedAt
    order.stored_at = receivedAt.plus({ hours: faker.number.int({ min: 1, max: 6 }) })
    order.retrieval_code = string.generateRandom(6).toUpperCase()
  })
  .state('awaiting_retrieval', (order, { faker }) => {
    order.status = 'awaiting_retrieval'
    const receivedAt = DateTime.fromJSDate(order.sent_at.toJSDate()).plus({
      days: faker.number.int({ min: 1, max: 3 }),
    })
    order.received_at = receivedAt
    order.stored_at = receivedAt.plus({ hours: faker.number.int({ min: 1, max: 6 }) })
    order.retrieval_code = string.generateRandom(6).toUpperCase()
  })
  .state('retrieved', (order, { faker }) => {
    order.status = 'retrieved'
    const receivedAt = DateTime.fromJSDate(order.sent_at.toJSDate()).plus({
      days: faker.number.int({ min: 1, max: 3 }),
    })
    const storedAt = receivedAt.plus({ hours: faker.number.int({ min: 1, max: 6 }) })
    order.received_at = receivedAt
    order.stored_at = storedAt
    order.retrieved_at = storedAt.plus({ days: faker.number.int({ min: 1, max: 7 }) })
    order.retrieval_code = string.generateRandom(6).toUpperCase()
  })
  .state('cancelled', (order, { faker }) => {
    order.status = 'cancelled'
    order.cancelled_at = DateTime.fromJSDate(order.sent_at.toJSDate()).plus({
      days: faker.number.int({ min: 1, max: 5 }),
    })
    order.cancellation_reason = faker.helpers.arrayElement([
      'Customer request',
      'Product unavailable',
      'Delivery issues',
      'Payment problem',
      'Wrong address',
    ])
  })
  .state('expired', (order) => {
    order.status = 'expired'
    order.sent_at = DateTime.now().minus({ days: 35 })
    order.expiration_date = DateTime.now().minus({ days: 5 })
    const receivedAt = order.sent_at.plus({ days: 2 })
    order.received_at = receivedAt
    order.stored_at = receivedAt.plus({ hours: 4 })
    order.retrieval_code = string.generateRandom(6).toUpperCase()
  })
  .state('urgent', (order, { faker }) => {
    order.metadata = {
      ...order.metadata,
      priority: 'urgent',
      expedited_delivery: true,
      priority_reason: faker.helpers.arrayElement([
        'Medical supplies',
        'VIP customer',
        'Time-sensitive',
        'Replacement order',
      ]),
    }
  })
  .state('large_order', (order, { faker }) => {
    order.metadata = {
      ...order.metadata,
      requires_large_locker: true,
      item_count: faker.number.int({ min: 5, max: 20 }),
      total_weight: faker.number.float({ min: 5, max: 25, fractionDigits: 2 }),
    }
  })
  .relation('customer', () => CustomerFactory)
  .relation('store', () => StoreFactory)
  .relation('locker', () => LockerFactory)
  .relation('items', () => OrderItemFactory)
  .relation('notifications', () => OrderNotificationFactory)
  .relation('statusHistory', () => OrderStatusHistoryFactory)
  .after('create', async (_factory, order, { faker }) => {
    // If an order is stored, assign a locker
    if (['stored', 'awaiting_retrieval', 'retrieved'].includes(order.status) && !order.locker_id) {
      const availableLocker = await LockerFactory.merge({
        store_id: order.store_id,
        status: 'occupied',
        current_order_id: order.id,
      })
        .apply('available')
        .create()

      order.locker_id = availableLocker.id
      await order.save()
    }

    // Create default items if none exist
    if (!order.$preloaded?.items) {
      await OrderItemFactory.merge({
        order_id: order.id,
      }).createMany(faker.number.int({ min: 1, max: 5 }))
    }
  })
  .build()

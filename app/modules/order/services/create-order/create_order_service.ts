import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import OrdersRepository from '#modules/order/repositories/orders_repository'
import CustomersRepository from '#modules/customer/repositories/customers_repository'
import StoresRepository from '#modules/store/repositories/stores_repository'
import IOrder from '#modules/order/interfaces/order_interface'
import Order from '#modules/order/models/order'
import OrderItem from '#modules/order/models/order_item'
import OrderStatusHistory from '#modules/order/models/order_status_history'
import NotFoundException from '#exceptions/not_found_exception'

@inject()
export default class CreateOrderService {
  constructor(
    private ordersRepository: OrdersRepository,
    private customersRepository: CustomersRepository,
    private storesRepository: StoresRepository
  ) {}

  async run(data: IOrder.CreateOrderData): Promise<Order> {
    // Validate customer exists
    const customer = await this.customersRepository.findBy('id', data.customer_id)
    if (!customer) {
      throw new NotFoundException('Customer not found')
    }

    // Validate store exists and is active
    const store = await this.storesRepository.findBy('id', data.store_id)
    if (!store) {
      throw new NotFoundException('Store not found')
    }
    if (!store.is_active) {
      throw new NotFoundException('Store is not active')
    }

    // Create order
    const order = await this.ordersRepository.create({
      order_number: data.order_number,
      customer_id: data.customer_id,
      store_id: data.store_id,
      status: 'sent',
      sent_at: DateTime.now(),
      expiration_date: DateTime.now().plus({ days: 30 }),
      metadata: data.metadata || {},
    })

    // Create order items
    for (const item of data.items) {
      await OrderItem.create({
        order_id: order.id,
        ...item,
      })
    }

    // Create initial status history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: null,
      to_status: 'sent',
      changed_by: 0, // System action (0 = system)
      reason: 'Order created',
    })

    // Load relationships
    await order.load('customer')
    await order.load('store')
    await order.load('items')

    return order
  }
}

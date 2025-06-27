import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import OrdersRepository from '#modules/order/repositories/orders_repository'
import OrderStatusHistory from '#modules/order/models/order_status_history'
import Order from '#modules/order/models/order'
import NotFoundException from '#exceptions/not_found_exception'
import BadRequestException from '#exceptions/bad_request_exception'

@inject()
export default class ReceiveOrderService {
  constructor(private ordersRepository: OrdersRepository) {}

  async run(orderNumber: string, userId: number): Promise<Order> {
    const order = await this.ordersRepository.findByOrderNumber(orderNumber)

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    // Validate order can be received
    if (!['sent'].includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be received. Current status: ${order.statusLabel}`
      )
    }

    // Update order status
    const previousStatus = order.status
    order.status = 'received'
    order.received_at = DateTime.now()
    await order.save()

    // Create status history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: previousStatus,
      to_status: 'received',
      changed_by: userId,
      reason: 'Order received at store',
    })

    // Load relationships
    await order.load('customer')
    await order.load('store')
    await order.load('items')

    return order
  }

  async markAsAwaitingStorage(orderId: number, userId: number): Promise<Order> {
    const order = await this.ordersRepository.findBy('id', orderId)

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    // Validate order can be marked as awaiting storage
    if (!['received'].includes(order.status)) {
      throw new BadRequestException(
        `Order cannot be marked as awaiting storage. Current status: ${order.statusLabel}`
      )
    }

    // Update order status
    const previousStatus = order.status
    order.status = 'awaiting_storage'
    await order.save()

    // Create status history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: previousStatus,
      to_status: 'awaiting_storage',
      changed_by: userId,
      reason: 'Order verified and ready for storage',
    })

    return order
  }
}

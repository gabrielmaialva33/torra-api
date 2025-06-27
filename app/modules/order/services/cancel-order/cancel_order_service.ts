import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import OrdersRepository from '#modules/order/repositories/orders_repository'
import LockersRepository from '#modules/locker/repositories/lockers_repository'
import OrderStatusHistory from '#modules/order/models/order_status_history'
import OrderNotification from '#modules/order/models/order_notification'
import Order from '#modules/order/models/order'
import IOrder from '#modules/order/interfaces/order_interface'
import NotFoundException from '#exceptions/not_found_exception'
import BadRequestException from '#exceptions/bad_request_exception'

@inject()
export default class CancelOrderService {
  constructor(
    private ordersRepository: OrdersRepository,
    private lockersRepository: LockersRepository
  ) {}

  async requestCancellation(data: IOrder.CancelOrderData): Promise<Order> {
    const order = await this.ordersRepository.findBy('id', data.order_id, {
      modifyQuery: (query) => {
        query.preload('customer').preload('store').preload('locker')
      },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    // Validate order can be cancelled
    if (!order.canBeCancelled) {
      throw new BadRequestException(
        `Order cannot be cancelled. Current status: ${order.statusLabel}`
      )
    }

    // Update order status to cancellation pending
    const previousStatus = order.status
    order.status = 'cancellation_pending'
    order.cancellation_reason = data.reason
    await order.save()

    // Create status history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: previousStatus,
      to_status: 'cancellation_pending',
      changed_by: data.user_id,
      reason: `Cancellation requested: ${data.reason}`,
    })

    // Create notification for store staff
    await OrderNotification.create({
      order_id: order.id,
      type: 'email',
      status: 'pending',
      content: `Cancellation requested for order ${order.order_number}. Reason: ${data.reason}`,
      metadata: {
        recipient: order.store.email,
      },
    })

    return order
  }

  async confirmCancellation(orderId: number, userId: number): Promise<Order> {
    const order = await this.ordersRepository.findBy('id', orderId, {
      modifyQuery: (query) => {
        query.preload('customer').preload('store').preload('locker')
      },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    if (order.status !== 'cancellation_pending') {
      throw new BadRequestException(
        `Order is not pending cancellation. Current status: ${order.statusLabel}`
      )
    }

    // Release locker if occupied
    if (order.locker_id) {
      await this.lockersRepository.releaseLocker(order.locker_id)
    }

    // Update order
    const previousStatus = order.status
    order.status = 'cancelled'
    order.cancelled_at = DateTime.now()
    await order.save()

    // Create status history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: previousStatus,
      to_status: 'cancelled',
      changed_by: userId,
      reason: 'Cancellation confirmed',
    })

    // Create notification for customer
    await OrderNotification.create({
      order_id: order.id,
      type: 'whatsapp',
      status: 'pending',
      content: `Seu pedido ${order.order_number} foi cancelado conforme solicitado. Motivo: ${order.cancellation_reason}`,
    })

    return order
  }

  async rejectCancellation(orderId: number, userId: number, reason: string): Promise<Order> {
    const order = await this.ordersRepository.findBy('id', orderId)

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    if (order.status !== 'cancellation_pending') {
      throw new BadRequestException(
        `Order is not pending cancellation. Current status: ${order.statusLabel}`
      )
    }

    // Determine the status to return to
    let returnStatus: Order['status'] = 'sent'
    if (order.retrieved_at) {
      returnStatus = 'retrieved'
    } else if (order.stored_at) {
      returnStatus = order.locker_id ? 'stored' : 'awaiting_storage'
    } else if (order.received_at) {
      returnStatus = 'received'
    }

    // Update order
    const previousStatus = order.status
    order.status = returnStatus
    order.cancellation_reason = null
    await order.save()

    // Create status history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: previousStatus,
      to_status: returnStatus,
      changed_by: userId,
      reason: `Cancellation rejected: ${reason}`,
    })

    return order
  }
}

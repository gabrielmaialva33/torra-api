import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import string from '@adonisjs/core/helpers/string'
import OrdersRepository from '#modules/order/repositories/orders_repository'
import LockersRepository from '#modules/locker/repositories/lockers_repository'
import OrderStatusHistory from '#modules/order/models/order_status_history'
import OrderNotification from '#modules/order/models/order_notification'
import Order from '#modules/order/models/order'
import IOrder from '#modules/order/interfaces/order_interface'
import ILocker from '#modules/locker/interfaces/locker_interface'
import NotFoundException from '#exceptions/not_found_exception'
import BadRequestException from '#exceptions/bad_request_exception'

@inject()
export default class StoreOrderService {
  constructor(
    private ordersRepository: OrdersRepository,
    private lockersRepository: LockersRepository
  ) {}

  async run(data: IOrder.StoreOrderData): Promise<Order> {
    const order = await this.ordersRepository.findBy('id', data.order_id, {
      modifyQuery: (query) => {
        query.preload('customer').preload('store').preload('items')
      },
    })

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    // Validate order can be stored
    if (!order.canBeStored) {
      throw new BadRequestException(`Order cannot be stored. Current status: ${order.statusLabel}`)
    }

    // Get the locker and validate
    const locker = await this.lockersRepository.findBy('id', data.locker_id)
    if (!locker) {
      throw new NotFoundException('Locker not found')
    }

    if (locker.store_id !== order.store_id) {
      throw new BadRequestException('Locker does not belong to the order store')
    }

    if (!locker.isAvailable) {
      throw new BadRequestException('Locker is not available')
    }

    // Determine locker size needed based on items
    const requiredSize = this.determineRequiredSize(order)
    if (!ILocker.canAccommodateOrder(locker.size, requiredSize)) {
      throw new BadRequestException(
        `Locker size ${locker.sizeLabel} cannot accommodate order requiring ${requiredSize}`
      )
    }

    // Occupy the locker
    await this.lockersRepository.occupyLocker(locker.id, order.id)

    // Generate retrieval code
    const retrievalCode = string.generateRandom(6).toUpperCase()

    // Update order
    const previousStatus = order.status
    order.status = 'stored'
    order.locker_id = locker.id
    order.stored_at = DateTime.now()
    order.retrieval_code = retrievalCode
    await order.save()

    // Create status history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: previousStatus,
      to_status: 'stored',
      changed_by: data.user_id,
      reason: `Stored in locker ${locker.code}`,
      metadata: { locker_id: locker.id, locker_code: locker.code },
    })

    // Create notification record (actual sending will be handled by notification service)
    await OrderNotification.create({
      order_id: order.id,
      type: 'whatsapp',
      status: 'pending',
      content: this.generateNotificationContent(order, locker.code, retrievalCode),
    })

    // Reload with locker
    await order.load('locker')

    return order
  }

  private determineRequiredSize(order: Order): ILocker.Size {
    // Simple logic based on number of items
    // This can be enhanced based on actual business rules
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

    if (totalItems <= 3) return ILocker.Size.SMALL
    if (totalItems <= 8) return ILocker.Size.MEDIUM
    return ILocker.Size.LARGE
  }

  private generateNotificationContent(
    order: Order,
    lockerCode: string,
    retrievalCode: string
  ): string {
    return `Olá ${order.customer.name}! Seu pedido ${order.order_number} está disponível para retirada na loja ${order.store.name}. 
    
Locker: ${lockerCode}
Código de retirada: ${retrievalCode}

O pedido ficará disponível até ${order.expiration_date.toFormat('dd/MM/yyyy')}.`
  }
}

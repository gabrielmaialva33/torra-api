import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import OrdersRepository from '#modules/order/repositories/orders_repository'
import LockersRepository from '#modules/locker/repositories/lockers_repository'
import CustomersRepository from '#modules/customer/repositories/customers_repository'
import OrderStatusHistory from '#modules/order/models/order_status_history'
import Order from '#modules/order/models/order'
import IOrder from '#modules/order/interfaces/order_interface'
import ICustomer from '#modules/customer/interfaces/customer_interface'
import NotFoundException from '#exceptions/not_found_exception'
import BadRequestException from '#exceptions/bad_request_exception'

@inject()
export default class RetrieveOrderService {
  constructor(
    private ordersRepository: OrdersRepository,
    private lockersRepository: LockersRepository,
    private customersRepository: CustomersRepository
  ) {}

  async run(data: IOrder.RetrieveOrderData): Promise<Order> {
    let order: Order | null = null

    // Find order by retrieval code or customer CPF
    if (data.retrieval_code) {
      order = await this.ordersRepository.findByRetrievalCode(data.retrieval_code)
    } else if (data.customer_cpf) {
      const cleanCpf = ICustomer.cleanCpf(data.customer_cpf)
      const customer = await this.customersRepository.findByCpf(cleanCpf)

      if (!customer) {
        throw new NotFoundException('Customer not found')
      }

      // Find the most recent order that can be retrieved
      const orders = await Order.query()
        .where('customer_id', customer.id)
        .whereIn('status', ['stored', 'awaiting_retrieval'])
        .orderBy('created_at', 'desc')
        .preload('customer')
        .preload('store')
        .preload('locker')

      order = orders[0] || null
    }

    if (!order) {
      throw new NotFoundException('No order found for retrieval')
    }

    // Validate order can be retrieved
    if (!order.canBeRetrieved) {
      throw new BadRequestException(
        `Order cannot be retrieved. Current status: ${order.statusLabel}`
      )
    }

    // Validate order hasn't expired
    if (order.isExpired) {
      throw new BadRequestException('Order has expired and cannot be retrieved')
    }

    // Release the locker
    if (order.locker_id) {
      await this.lockersRepository.releaseLocker(order.locker_id)
    }

    // Update order
    const previousStatus = order.status
    order.status = 'retrieved'
    order.retrieved_at = DateTime.now()
    await order.save()

    // Create status history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: previousStatus,
      to_status: 'retrieved',
      changed_by: data.user_id,
      reason: 'Order retrieved by customer',
      metadata: {
        retrieval_method: data.retrieval_code ? 'code' : 'cpf',
      },
    })

    return order
  }

  async confirmRetrieval(orderId: number, userId: number): Promise<Order> {
    const order = await this.ordersRepository.findBy('id', orderId)

    if (!order) {
      throw new NotFoundException('Order not found')
    }

    if (order.status !== 'awaiting_retrieval') {
      throw new BadRequestException(
        `Order is not awaiting retrieval confirmation. Current status: ${order.statusLabel}`
      )
    }

    // Update to retrieved
    order.status = 'retrieved'
    order.retrieved_at = DateTime.now()
    await order.save()

    // Create status history
    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: 'awaiting_retrieval',
      to_status: 'retrieved',
      changed_by: userId,
      reason: 'Retrieval confirmed',
    })

    return order
  }
}

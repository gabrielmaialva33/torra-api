import LucidRepository from '#shared/lucid/lucid_repository'
import Order from '#modules/order/models/order'
import IOrder from '#modules/order/interfaces/order_interface'
import { DateTime } from 'luxon'

export default class OrdersRepository
  extends LucidRepository<typeof Order>
  implements IOrder.Repository
{
  constructor() {
    super(Order)
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.findBy('order_number', orderNumber, {
      modifyQuery: (query) => {
        query
          .preload('customer')
          .preload('store')
          .preload('locker')
          .preload('items')
          .preload('statusHistory')
      },
    })
  }

  async findByRetrievalCode(retrievalCode: string): Promise<Order | null> {
    return Order.query()
      .where('retrieval_code', retrievalCode)
      .whereIn('status', ['stored', 'awaiting_retrieval'])
      .preload('customer')
      .preload('store')
      .preload('locker')
      .first()
  }

  async findByStore(storeId: number, filters?: IOrder.OrderFilters): Promise<Order[]> {
    const query = Order.query().where('store_id', storeId)

    this.applyFilters(query, filters)

    return query.preload('customer').preload('locker').orderBy('created_at', 'desc')
  }

  async findPendingByStore(storeId: number): Promise<Order[]> {
    return Order.query()
      .where('store_id', storeId)
      .whereIn('status', ['sent', 'received', 'awaiting_storage'])
      .preload('customer')
      .orderBy('sent_at', 'asc')
  }

  async findExpiredOrders(): Promise<Order[]> {
    return Order.query()
      .where('expiration_date', '<', DateTime.now().toSQL())
      .whereNotIn('status', ['retrieved', 'cancelled', 'expired'])
      .preload('customer')
      .preload('store')
      .preload('locker')
  }

  async getStoreMetrics(storeId: number): Promise<IOrder.StoreMetrics> {
    const statuses = await Order.query()
      .where('store_id', storeId)
      .select('status')
      .count('* as total')
      .groupBy('status')

    const metrics: IOrder.StoreMetrics = {
      total: 0,
      sent: 0,
      received: 0,
      awaiting_storage: 0,
      stored: 0,
      awaiting_retrieval: 0,
      retrieved: 0,
      cancellation_pending: 0,
      cancelled: 0,
      expired: 0,
    }

    statuses.forEach((row) => {
      const status = row.status as keyof IOrder.StoreMetrics
      const count = Number(row.$extras.total)
      metrics[status] = count
      metrics.total += count
    })

    return metrics
  }

  private applyFilters(query: any, filters?: IOrder.OrderFilters): void {
    if (!filters) return

    if (filters.status) {
      query.where('status', filters.status)
    }

    if (filters.customerId) {
      query.where('customer_id', filters.customerId)
    }

    if (filters.lockerId) {
      query.where('locker_id', filters.lockerId)
    }

    if (filters.dateFrom) {
      query.where('created_at', '>=', filters.dateFrom.toSQL())
    }

    if (filters.dateTo) {
      query.where('created_at', '<=', filters.dateTo.toSQL())
    }

    if (filters.search) {
      query.where((subQuery: any) => {
        subQuery
          .where('order_number', 'LIKE', `%${filters.search}%`)
          .orWhere('retrieval_code', 'LIKE', `%${filters.search}%`)
          .orWhereHas('customer', (customerQuery: any) => {
            customerQuery
              .where('name', 'ILIKE', `%${filters.search}%`)
              .orWhere('cpf', 'LIKE', `%${filters.search}%`)
          })
      })
    }
  }
}

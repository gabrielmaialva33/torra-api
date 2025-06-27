import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import CreateOrderService from '#modules/order/services/create-order/create_order_service'
import ReceiveOrderService from '#modules/order/services/receive-order/receive_order_service'
import StoreOrderService from '#modules/order/services/store-order/store_order_service'
import RetrieveOrderService from '#modules/order/services/retrieve-order/retrieve_order_service'
import CancelOrderService from '#modules/order/services/cancel-order/cancel_order_service'
import OrdersRepository from '#modules/order/repositories/orders_repository'

import {
  createOrderValidator,
  receiveOrderValidator,
  storeOrderValidator,
  retrieveOrderValidator,
  cancelOrderValidator,
  confirmCancellationValidator,
  rejectCancellationValidator,
  listOrdersValidator,
} from '#modules/order/validators/orders_validator'

@inject()
export default class OrdersController {
  constructor(private ordersRepository: OrdersRepository) {}

  async paginate({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)
    const sortBy = request.input('sort_by', 'id')
    const direction = request.input('order', 'asc')
    const search = request.input('search', undefined)

    const validated = await listOrdersValidator.validate(request.all())

    const orders = await this.ordersRepository.paginate({
      page,
      perPage,
      sortBy,
      direction,
      modifyQuery: (query) => {
        if (validated.status) {
          query.where('status', validated.status)
        }
        if (validated.store_id) {
          query.where('store_id', validated.store_id)
        }
        if (validated.customer_id) {
          query.where('customer_id', validated.customer_id)
        }
        if (validated.date_from) {
          query.where('created_at', '>=', validated.date_from.toSQL())
        }
        if (validated.date_to) {
          query.where('created_at', '<=', validated.date_to.toSQL())
        }
        if (search) {
          query.where((subQuery) => {
            subQuery
              .where('order_number', 'LIKE', `%${search}%`)
              .orWhere('retrieval_code', 'LIKE', `%${search}%`)
              .orWhereHas('customer', (customerQuery) => {
                customerQuery
                  .where('name', 'ILIKE', `%${search}%`)
                  .orWhere('cpf', 'LIKE', `%${search}%`)
              })
          })
        }
        query.preload('customer').preload('store').preload('locker')
      },
    })

    return response.json(orders)
  }

  async get({ params, response }: HttpContext) {
    const orderId = +params.id

    const order = await this.ordersRepository.findBy('id', orderId, {
      modifyQuery: (query) => {
        query
          .preload('customer')
          .preload('store')
          .preload('locker')
          .preload('items')
          .preload('statusHistory', (historyQuery) => {
            historyQuery.orderBy('created_at', 'desc')
          })
          .preload('notifications', (notifQuery) => {
            notifQuery.orderBy('created_at', 'desc')
          })
      },
    })

    if (!order) {
      return response.notFound({ message: 'Order not found' })
    }

    return response.json(order)
  }

  async getByOrderNumber({ params, response }: HttpContext) {
    const orderNumber = params.orderNumber

    const order = await this.ordersRepository.findByOrderNumber(orderNumber)

    if (!order) {
      return response.notFound({ message: 'Order not found' })
    }

    return response.json(order)
  }

  async create({ request, response }: HttpContext) {
    const payload = await createOrderValidator.validate(request.all())

    const service = await app.container.make(CreateOrderService)
    const order = await service.run(payload)

    return response.created(order)
  }

  async receive({ request, response, auth }: HttpContext) {
    const payload = await receiveOrderValidator.validate(request.all())

    const service = await app.container.make(ReceiveOrderService)
    const order = await service.run(payload.order_number, auth.user!.id)

    return response.json(order)
  }

  async markAsAwaitingStorage({ params, response, auth }: HttpContext) {
    const orderId = +params.id

    const service = await app.container.make(ReceiveOrderService)
    const order = await service.markAsAwaitingStorage(orderId, auth.user!.id)

    return response.json(order)
  }

  async store({ request, response, auth }: HttpContext) {
    const payload = await storeOrderValidator.validate(request.all())

    const service = await app.container.make(StoreOrderService)
    const order = await service.run({
      ...payload,
      user_id: auth.user!.id,
    })

    return response.json(order)
  }

  async retrieve({ request, response, auth }: HttpContext) {
    const payload = await retrieveOrderValidator.validate(request.all())

    const service = await app.container.make(RetrieveOrderService)
    const order = await service.run({
      ...payload,
      user_id: auth.user!.id,
    })

    return response.json(order)
  }

  async confirmRetrieval({ params, response, auth }: HttpContext) {
    const orderId = +params.id

    const service = await app.container.make(RetrieveOrderService)
    const order = await service.confirmRetrieval(orderId, auth.user!.id)

    return response.json(order)
  }

  async requestCancellation({ request, response, auth }: HttpContext) {
    const payload = await cancelOrderValidator.validate(request.all())

    const service = await app.container.make(CancelOrderService)
    const order = await service.requestCancellation({
      ...payload,
      user_id: auth.user!.id,
    })

    return response.json(order)
  }

  async confirmCancellation({ request, response, auth }: HttpContext) {
    const payload = await confirmCancellationValidator.validate(request.all())

    const service = await app.container.make(CancelOrderService)
    const order = await service.confirmCancellation(payload.order_id, auth.user!.id)

    return response.json(order)
  }

  async rejectCancellation({ request, response, auth }: HttpContext) {
    const payload = await rejectCancellationValidator.validate(request.all())

    const service = await app.container.make(CancelOrderService)
    const order = await service.rejectCancellation(payload.order_id, auth.user!.id, payload.reason)

    return response.json(order)
  }

  async getStoreMetrics({ params, response }: HttpContext) {
    const storeId = +params.storeId

    const metrics = await this.ordersRepository.getStoreMetrics(storeId)

    return response.json(metrics)
  }
}

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { apiThrottle } from '#start/limiter'
import IPermission from '#modules/permission/interfaces/permission_interface'

const OrdersController = () => import('#modules/order/controllers/orders_controller')

router
  .group(() => {
    // List orders (paginated)
    router
      .get('/', [OrdersController, 'paginate'])
      .use(
        middleware.permission({
          permissions: `orders.${IPermission.Actions.LIST}`,
        })
      )
      .as('orders.paginate')

    // Get order by ID
    router
      .get('/:id', [OrdersController, 'get'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `orders.${IPermission.Actions.READ}`,
        })
      )
      .as('orders.get')

    // Get order by order number
    router
      .get('/by-number/:orderNumber', [OrdersController, 'getByOrderNumber'])
      .use(
        middleware.permission({
          permissions: `orders.${IPermission.Actions.READ}`,
        })
      )
      .as('orders.getByOrderNumber')

    // Get store metrics
    router
      .get('/stores/:storeId/metrics', [OrdersController, 'getStoreMetrics'])
      .where('storeId', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `orders.${IPermission.Actions.READ}`,
        })
      )
      .as('orders.storeMetrics')

    // Create new order
    router
      .post('/', [OrdersController, 'create'])
      .use(
        middleware.permission({
          permissions: `orders.${IPermission.Actions.CREATE}`,
        })
      )
      .as('orders.create')

    // Receive order
    router
      .post('/receive', [OrdersController, 'receive'])
      .use(
        middleware.permission({
          permissions: `orders.receive`,
        })
      )
      .as('orders.receive')

    // Mark as awaiting storage
    router
      .patch('/:id/awaiting-storage', [OrdersController, 'markAsAwaitingStorage'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `orders.receive`,
        })
      )
      .as('orders.markAsAwaitingStorage')

    // Store order in locker
    router
      .post('/store', [OrdersController, 'store'])
      .use(
        middleware.permission({
          permissions: `orders.store`,
        })
      )
      .as('orders.store')

    // Retrieve order
    router
      .post('/retrieve', [OrdersController, 'retrieve'])
      .use(
        middleware.permission({
          permissions: `orders.retrieve`,
        })
      )
      .as('orders.retrieve')

    // Confirm retrieval
    router
      .patch('/:id/confirm-retrieval', [OrdersController, 'confirmRetrieval'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `orders.retrieve`,
        })
      )
      .as('orders.confirmRetrieval')

    // Request cancellation
    router
      .post('/cancel', [OrdersController, 'requestCancellation'])
      .use(
        middleware.permission({
          permissions: `orders.cancel`,
        })
      )
      .as('orders.requestCancellation')

    // Confirm cancellation
    router
      .post('/cancel/confirm', [OrdersController, 'confirmCancellation'])
      .use(
        middleware.permission({
          permissions: `orders.cancel`,
        })
      )
      .as('orders.confirmCancellation')

    // Reject cancellation
    router
      .post('/cancel/reject', [OrdersController, 'rejectCancellation'])
      .use(
        middleware.permission({
          permissions: `orders.cancel`,
        })
      )
      .as('orders.rejectCancellation')
  })
  .use([middleware.auth(), apiThrottle])
  .prefix('/api/v1/orders')

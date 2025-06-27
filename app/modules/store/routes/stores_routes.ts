import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { apiThrottle } from '#start/limiter'
import IPermission from '#modules/permission/interfaces/permission_interface'

const StoresController = () => import('#modules/store/controllers/stores_controller')

router
  .group(() => {
    // List all stores (paginated)
    router
      .get('/', [StoresController, 'paginate'])
      .use(
        middleware.permission({
          permissions: `stores.${IPermission.Actions.LIST}`,
        })
      )
      .as('stores.paginate')

    // Get active stores only
    router
      .get('/active', [StoresController, 'listActive'])
      .use(
        middleware.permission({
          permissions: `stores.${IPermission.Actions.LIST}`,
        })
      )
      .as('stores.active')

    // Get stores by logged user
    router.get('/my-stores', [StoresController, 'listByUser']).as('stores.my-stores')

    // Get store by ID
    router
      .get('/:id', [StoresController, 'get'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `stores.${IPermission.Actions.READ}`,
        })
      )
      .as('stores.get')

    // Get store by code
    router
      .get('/by-code/:code', [StoresController, 'getByCode'])
      .use(
        middleware.permission({
          permissions: `stores.${IPermission.Actions.READ}`,
        })
      )
      .as('stores.getByCode')

    // Create new store
    router
      .post('/', [StoresController, 'create'])
      .use(
        middleware.permission({
          permissions: `stores.${IPermission.Actions.CREATE}`,
        })
      )
      .as('stores.create')

    // Update store
    router
      .put('/:id', [StoresController, 'update'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `stores.${IPermission.Actions.UPDATE}`,
        })
      )
      .as('stores.update')

    // Assign user to store
    router
      .post('/:id/users', [StoresController, 'assignUser'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `stores.${IPermission.Actions.ASSIGN}`,
        })
      )
      .as('stores.assignUser')

    // Remove user from store
    router
      .delete('/:id/users/:userId', [StoresController, 'removeUser'])
      .where('id', /^[0-9]+$/)
      .where('userId', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `stores.${IPermission.Actions.ASSIGN}`,
        })
      )
      .as('stores.removeUser')

    // Deactivate user in store
    router
      .patch('/:id/users/:userId/deactivate', [StoresController, 'deactivateUser'])
      .where('id', /^[0-9]+$/)
      .where('userId', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `stores.${IPermission.Actions.ASSIGN}`,
        })
      )
      .as('stores.deactivateUser')
  })
  .use([middleware.auth(), apiThrottle])
  .prefix('/api/v1/stores')

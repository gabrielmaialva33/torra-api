import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { apiThrottle } from '#start/limiter'
import IPermission from '#modules/permission/interfaces/permission_interface'

const LockersController = () => import('#modules/locker/controllers/lockers_controller')

router
  .group(() => {
    // List lockers by store
    router
      .get('/stores/:storeId', [LockersController, 'listByStore'])
      .where('storeId', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `lockers.${IPermission.Actions.LIST}`,
        })
      )
      .as('lockers.listByStore')

    // Get available lockers
    router
      .get('/stores/:storeId/available', [LockersController, 'getAvailable'])
      .where('storeId', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `lockers.${IPermission.Actions.LIST}`,
        })
      )
      .as('lockers.getAvailable')

    // Get locker by ID
    router
      .get('/:id', [LockersController, 'get'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `lockers.${IPermission.Actions.READ}`,
        })
      )
      .as('lockers.get')

    // Create new locker
    router
      .post('/', [LockersController, 'create'])
      .use(
        middleware.permission({
          permissions: `lockers.${IPermission.Actions.CREATE}`,
        })
      )
      .as('lockers.create')

    // Update locker
    router
      .put('/:id', [LockersController, 'update'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `lockers.${IPermission.Actions.UPDATE}`,
        })
      )
      .as('lockers.update')

    // Set locker maintenance
    router
      .post('/:id/maintenance', [LockersController, 'setMaintenance'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `lockers.${IPermission.Actions.UPDATE}`,
        })
      )
      .as('lockers.setMaintenance')

    // Remove locker maintenance
    router
      .delete('/:id/maintenance', [LockersController, 'removeMaintenance'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `lockers.${IPermission.Actions.UPDATE}`,
        })
      )
      .as('lockers.removeMaintenance')
  })
  .use([middleware.auth(), apiThrottle])
  .prefix('/api/v1/lockers')

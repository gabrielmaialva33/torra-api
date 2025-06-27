import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { apiThrottle } from '#start/limiter'
import IPermission from '#modules/permission/interfaces/permission_interface'

const CustomersController = () => import('#modules/customer/controllers/customers_controller')

router
  .group(() => {
    // Search customers
    router
      .get('/search', [CustomersController, 'search'])
      .use(
        middleware.permission({
          permissions: `customers.${IPermission.Actions.LIST}`,
        })
      )
      .as('customers.search')

    // Get customer by ID
    router
      .get('/:id', [CustomersController, 'get'])
      .where('id', /^[0-9]+$/)
      .use(
        middleware.permission({
          permissions: `customers.${IPermission.Actions.READ}`,
        })
      )
      .as('customers.get')

    // Get customer by CPF
    router
      .get('/by-cpf/:cpf', [CustomersController, 'getByCpf'])
      .use(
        middleware.permission({
          permissions: `customers.${IPermission.Actions.READ}`,
        })
      )
      .as('customers.getByCpf')

    // Create new customer
    router
      .post('/', [CustomersController, 'create'])
      .use(
        middleware.permission({
          permissions: `customers.${IPermission.Actions.CREATE}`,
        })
      )
      .as('customers.create')
  })
  .use([middleware.auth(), apiThrottle])
  .prefix('/api/v1/customers')

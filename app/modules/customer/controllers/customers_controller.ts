import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import CreateCustomerService from '#modules/customer/services/create-customer/create_customer_service'
import CustomersRepository from '#modules/customer/repositories/customers_repository'
import ICustomer from '#modules/customer/interfaces/customer_interface'

import {
  createCustomerValidator,
  searchCustomerValidator,
  listCustomersValidator,
} from '#modules/customer/validators/customers_validator'

@inject()
export default class CustomersController {
  constructor(private customersRepository: CustomersRepository) {}

  async paginate({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)
    const sortBy = request.input('sort_by', 'id')
    const direction = request.input('order', 'asc')
    const search = request.input('search', undefined)

    const validated = await listCustomersValidator.validate(request.all())

    const customers = await this.customersRepository.paginate({
      page,
      perPage,
      sortBy,
      direction,
      modifyQuery: (query) => {
        if (validated.has_orders !== undefined) {
          if (validated.has_orders) {
            query.whereHas('orders')
          } else {
            query.whereDoesntHave('orders')
          }
        }
        if (search) {
          query.where((subQuery) => {
            subQuery
              .where('name', 'ILIKE', `%${search}%`)
              .orWhere('cpf', 'LIKE', `%${search}%`)
              .orWhere('email', 'ILIKE', `%${search}%`)
              .orWhere('phone', 'LIKE', `%${search}%`)
          })
        }
        query.preload('orders', (ordersQuery) => {
          ordersQuery.limit(5).orderBy('created_at', 'desc')
        })
      },
    })

    return response.json(customers)
  }

  async search({ request, response }: HttpContext) {
    const payload = await searchCustomerValidator.validate(request.all())
    const searchValue = payload.cpf || payload.email || payload.phone || ''

    const customers = await this.customersRepository.searchCustomers(searchValue)

    return response.json(customers)
  }

  async get({ params, response }: HttpContext) {
    const customerId = +params.id

    const customer = await this.customersRepository.findBy('id', customerId, {
      modifyQuery: (query) => {
        query.preload('orders', (ordersQuery) => {
          ordersQuery.limit(10).orderBy('created_at', 'desc')
        })
      },
    })

    if (!customer) {
      return response.notFound({ message: 'Customer not found' })
    }

    return response.json(customer)
  }

  async getByCpf({ params, response }: HttpContext) {
    const cpf = ICustomer.cleanCpf(params.cpf)

    const customer = await this.customersRepository.findByCpf(cpf)

    if (!customer) {
      return response.notFound({ message: 'Customer not found' })
    }

    return response.json(customer)
  }

  async create({ request, response }: HttpContext) {
    const payload = await createCustomerValidator.validate(request.all())

    const service = await app.container.make(CreateCustomerService)
    const customer = await service.run(payload as ICustomer.CreateCustomerData)

    return response.created(customer)
  }
}

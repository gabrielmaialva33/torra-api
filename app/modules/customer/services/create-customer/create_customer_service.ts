import { inject } from '@adonisjs/core'
import CustomersRepository from '#modules/customer/repositories/customers_repository'
import ICustomer from '#modules/customer/interfaces/customer_interface'

@inject()
export default class CreateCustomerService {
  constructor(private customersRepository: CustomersRepository) {}

  async run(payload: ICustomer.CreateCustomerData) {
    return this.customersRepository.create(payload)
  }
}

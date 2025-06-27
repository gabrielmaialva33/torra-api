import LucidRepository from '#shared/lucid/lucid_repository'
import Customer from '#modules/customer/models/customer'
import ICustomer from '#modules/customer/interfaces/customer_interface'

export default class CustomersRepository
  extends LucidRepository<typeof Customer>
  implements ICustomer.Repository
{
  constructor() {
    super(Customer)
  }

  async findByCpf(cpf: string): Promise<Customer | null> {
    return this.findBy('cpf', cpf, {
      modifyQuery: (query) => {
        query.preload('orders')
      },
    })
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.findBy('email', email)
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.findBy('phone', phone)
  }

  async searchCustomers(search: string): Promise<Customer[]> {
    return Customer.query()
      .where((query) => {
        query
          .where('name', 'ILIKE', `%${search}%`)
          .orWhere('cpf', 'LIKE', `%${search}%`)
          .orWhere('email', 'ILIKE', `%${search}%`)
          .orWhere('phone', 'LIKE', `%${search}%`)
      })
      .orderBy('name', 'asc')
      .limit(20)
  }
}

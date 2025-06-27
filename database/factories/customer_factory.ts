import Factory from '@adonisjs/lucid/factories'

import Customer from '#modules/customer/models/customer'
import ICustomer from '#modules/customer/interfaces/customer_interface'
import { OrderFactory } from '#database/factories/order_factory'

/**
 * Generate a valid CPF number
 */
function generateCPF(): string {
  const randomDigits = () => Math.floor(Math.random() * 10)

  // Generate first 9 digits
  const digits: number[] = []
  for (let i = 0; i < 9; i++) {
    digits.push(randomDigits())
  }

  // Calculate first check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i)
  }
  let checkDigit1 = 11 - (sum % 11)
  if (checkDigit1 >= 10) checkDigit1 = 0
  digits.push(checkDigit1)

  // Calculate second check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * (11 - i)
  }
  let checkDigit2 = 11 - (sum % 11)
  if (checkDigit2 >= 10) checkDigit2 = 0
  digits.push(checkDigit2)

  return digits.join('')
}

export const CustomerFactory = Factory.define(Customer, ({ faker }) => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()

  return {
    name: `${firstName} ${lastName}`,
    cpf: generateCPF(),
    email: faker.internet.email({ firstName, lastName }),
    phone: faker.helpers.arrayElement([
      faker.phone.number({ style: 'international' }),
      faker.phone.number({ style: 'human' }),
    ]),
    metadata: {
      registration_source: faker.helpers.arrayElement(['web', 'app', 'store', 'call_center']),
      preferred_contact: faker.helpers.arrayElement(['whatsapp', 'sms', 'email']),
      accepts_marketing: faker.datatype.boolean({ probability: 0.7 }),
      registration_date: faker.date.past({ years: 2 }),
    },
  }
})
  .state('vip', (customer, { faker }) => {
    customer.metadata = {
      ...customer.metadata,
      vip_status: true,
      vip_since: faker.date.past({ years: 1 }),
      priority_support: true,
    }
  })
  .state('blocked', (customer, { faker }) => {
    customer.metadata = {
      ...customer.metadata,
      blocked: true,
      blocked_reason: faker.helpers.arrayElement([
        'Fraud suspicion',
        'Multiple order cancellations',
        'Payment issues',
      ]),
      blocked_at: faker.date.recent({ days: 30 }),
    }
  })
  .state('corporate', (customer, { faker }) => {
    const company = faker.company.name()
    customer.name = `${customer.name} - ${company}`
    customer.email = faker.internet.email({
      firstName: faker.person.firstName().toLowerCase(),
      provider: faker.internet.domainName(),
    })
    customer.metadata = {
      ...customer.metadata,
      is_corporate: true,
      company_name: company,
      corporate_discount: faker.number.int({ min: 5, max: 20 }),
    }
  })
  .relation('orders', () => OrderFactory)
  .before('create', async (_factory, customer) => {
    // Ensure CPF is unique by checking database
    let attempts = 0
    while (attempts < 10) {
      const exists = await Customer.query().where('cpf', customer.cpf).first()
      if (!exists) break

      customer.cpf = generateCPF()
      attempts++
    }
  })
  .after('makeStubbed', (_factory, customer) => {
    // Format CPF for stubbed instances
    customer.cpf = ICustomer.formatCpf(customer.cpf)
  })
  .build()

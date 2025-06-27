import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import ICustomer from '#modules/customer/interfaces/customer_interface'
import { createPaginationValidator } from '#shared/validators/pagination_validator'

/**
 * Custom CPF validation rule
 */
const cpfRule = vine.createRule((value: unknown, _, field) => {
  if (typeof value !== 'string') {
    field.report('The {{ field }} field must be a string', 'cpf', field)
    return
  }

  const cleanCpf = ICustomer.cleanCpf(value)

  if (!ICustomer.validateCpf(cleanCpf)) {
    field.report('The {{ field }} field must be a valid CPF', 'cpf', field)
  }
})

/**
 * Custom unique validation rule for CPF
 */
const uniqueCpfRule = vine.createRule(async (value: unknown, _, field) => {
  if (typeof value !== 'string') return

  const cleanCpf = ICustomer.cleanCpf(value)
  const customer = await db.from('customers').where('cpf', cleanCpf).first()

  if (customer) {
    field.report('The {{ field }} has already been taken', 'unique', field)
  }
})

/**
 * Custom unique validation rule for email
 */
const uniqueEmailRule = vine.createRule(async (value: unknown, _, field) => {
  if (typeof value !== 'string') return

  const customer = await db.from('customers').where('email', value).first()

  if (customer) {
    field.report('The {{ field }} has already been taken', 'unique', field)
  }
})

/**
 * Custom unique validation rule for phone
 */
const uniquePhoneRule = vine.createRule(async (value: unknown, _, field) => {
  if (typeof value !== 'string') return

  const cleanPhone = ICustomer.cleanPhone(value)
  const customer = await db.from('customers').where('phone', cleanPhone).first()

  if (customer) {
    field.report('The {{ field }} has already been taken', 'unique', field)
  }
})

/**
 * Custom unique validation rule for update (excludes current customer)
 */
const uniqueEmailForUpdateRule = (customerId: number) => {
  return vine.createRule(async (value: unknown, _, field) => {
    if (typeof value !== 'string') return

    const customer = await db
      .from('customers')
      .whereNot('id', customerId)
      .where('email', value)
      .first()

    if (customer) {
      field.report('The {{ field }} has already been taken', 'unique', field)
    }
  })
}

/**
 * Custom unique validation rule for phone update
 */
const uniquePhoneForUpdateRule = (customerId: number) => {
  return vine.createRule(async (value: unknown, _, field) => {
    if (typeof value !== 'string') return

    const cleanPhone = ICustomer.cleanPhone(value)
    const customer = await db
      .from('customers')
      .whereNot('id', customerId)
      .where('phone', cleanPhone)
      .first()

    if (customer) {
      field.report('The {{ field }} has already been taken', 'unique', field)
    }
  })
}

export const createCustomerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    cpf: vine
      .string()
      .trim()
      .use(cpfRule())
      .use(uniqueCpfRule())
      .transform((value) => ICustomer.cleanCpf(value)),
    email: vine.string().email().trim().use(uniqueEmailRule()),
    phone: vine
      .string()
      .trim()
      .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)
      .use(uniquePhoneRule())
      .transform((value) => ICustomer.cleanPhone(value)),
    metadata: vine.object({}).optional(),
  })
)

export const updateCustomerValidator = vine.withMetaData<{ customerId: number }>().compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255).optional(),
    email: vine.string().email().trim().optional(),
    phone: vine
      .string()
      .trim()
      .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)
      .transform((value) => ICustomer.cleanPhone(value))
      .optional(),
    metadata: vine.object({}).optional(),
  })
)

// Create a separate validator function that handles unique validation
export const validateUpdateCustomer = async (data: any, customerId: number) => {
  // First validate the structure
  const validated = await updateCustomerValidator.validate(data, { meta: { customerId } })

  // Then check uniqueness if email or phone provided
  if (validated.email) {
    const emailValidator = vine.compile(
      vine.object({
        email: vine.string().use(uniqueEmailForUpdateRule(customerId)()),
      })
    )
    await emailValidator.validate({ email: validated.email })
  }

  if (validated.phone) {
    const phoneValidator = vine.compile(
      vine.object({
        phone: vine.string().use(uniquePhoneForUpdateRule(customerId)()),
      })
    )
    await phoneValidator.validate({ phone: validated.phone })
  }

  return validated
}

/**
 * Validator for listing customers with pagination
 */
export const listCustomersValidator = createPaginationValidator({
  has_orders: vine.boolean().optional(),
})

/**
 * Custom validator for search that requires at least one field
 */
const atLeastOneFieldRule = vine.createRule((value: unknown, _, field) => {
  const obj = value as any
  if (!obj.cpf && !obj.email && !obj.phone) {
    field.report('At least one search parameter is required', 'atLeastOne', field)
  }
})

/**
 * Validator for searching customer by CPF or email
 */
export const searchCustomerValidator = vine.compile(
  vine
    .object({
      cpf: vine
        .string()
        .trim()
        .use(cpfRule())
        .optional()
        .transform((value) => ICustomer.cleanCpf(value)),
      email: vine.string().trim().email().optional(),
      phone: vine
        .string()
        .trim()
        .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)
        .optional()
        .transform((value) => ICustomer.cleanPhone(value)),
    })
    .use(atLeastOneFieldRule())
)

/**
 * Validator for customer orders listing
 */
export const listCustomerOrdersValidator = createPaginationValidator({
  status: vine
    .enum([
      'sent',
      'received',
      'awaiting_storage',
      'stored',
      'awaiting_retrieval',
      'retrieved',
      'cancellation_pending',
      'cancelled',
      'expired',
    ] as const)
    .optional(),
  date_from: vine.date().optional(),
  date_to: vine.date().optional(),
})

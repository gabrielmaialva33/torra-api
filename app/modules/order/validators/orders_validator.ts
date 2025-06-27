import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import { createPaginationValidator } from '#shared/validators/pagination_validator'

/**
 * Custom unique validation rule for order number
 */
const uniqueOrderNumberRule = vine.createRule(async (value: unknown, _, field) => {
  if (typeof value !== 'string') return

  const order = await db.from('orders').where('order_number', value).first()

  if (order) {
    field.report('The {{ field }} has already been taken', 'unique', field)
  }
})

/**
 * Custom validation rule to ensure at least one field is provided
 */
const atLeastOneFieldRule = vine.createRule((value: unknown, _, field) => {
  const obj = value as any
  if (!obj.retrieval_code && !obj.customer_cpf) {
    field.report('Either retrieval code or customer CPF is required', 'atLeastOne', field)
  }
})

export const createOrderValidator = vine.compile(
  vine.object({
    order_number: vine.string().trim().minLength(3).maxLength(50).use(uniqueOrderNumberRule()),
    customer_id: vine.number().positive(),
    store_id: vine.number().positive(),
    items: vine
      .array(
        vine.object({
          product_name: vine.string().trim().minLength(1),
          quantity: vine.number().positive(),
          sku: vine.string().trim(),
          price: vine.number().positive(),
          metadata: vine.object({}).optional(),
        })
      )
      .minLength(1),
    metadata: vine.object({}).optional(),
  })
)

export const receiveOrderValidator = vine.compile(
  vine.object({
    order_number: vine.string().trim(),
  })
)

export const storeOrderValidator = vine.compile(
  vine.object({
    order_id: vine.number().positive(),
    locker_id: vine.number().positive(),
  })
)

export const retrieveOrderValidator = vine.compile(
  vine
    .object({
      retrieval_code: vine.string().trim().optional(),
      customer_cpf: vine.string().trim().optional(),
    })
    .use(atLeastOneFieldRule())
)

export const cancelOrderValidator = vine.compile(
  vine.object({
    order_id: vine.number().positive(),
    reason: vine.string().trim().minLength(10).maxLength(500),
  })
)

export const confirmCancellationValidator = vine.compile(
  vine.object({
    order_id: vine.number().positive(),
  })
)

export const rejectCancellationValidator = vine.compile(
  vine.object({
    order_id: vine.number().positive(),
    reason: vine.string().trim().minLength(10).maxLength(500),
  })
)

export const listOrdersValidator = createPaginationValidator({
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
    ])
    .optional(),
  store_id: vine.number().positive().optional(),
  customer_id: vine.number().positive().optional(),
  date_from: vine.date().optional(),
  date_to: vine.date().optional(),
})

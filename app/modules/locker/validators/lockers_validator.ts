import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import { createPaginationValidator } from '#shared/validators/pagination_validator'

/**
 * Custom unique validation rule for locker code
 */
const uniqueLockerCodeRule = (storeId: number) => {
  return vine.createRule(async (value: unknown, _, field) => {
    if (typeof value !== 'string') return

    const locker = await db.from('lockers').where('code', value).where('store_id', storeId).first()

    if (locker) {
      field.report('The {{ field }} has already been taken', 'unique', field)
    }
  })
}

/**
 * Custom unique validation rule for locker code update
 */
const uniqueLockerCodeForUpdateRule = (lockerId: number) => {
  return vine.createRule(async (value: unknown, _, field) => {
    if (typeof value !== 'string') return

    const locker = await db
      .from('lockers')
      .where('code', value)
      .whereNot('id', lockerId)
      .whereExists((query) => {
        query
          .from('lockers as l2')
          .where('l2.id', lockerId)
          .whereRaw('lockers.store_id = l2.store_id')
      })
      .first()

    if (locker) {
      field.report('The {{ field }} has already been taken', 'unique', field)
    }
  })
}

/**
 * Validator for creating a new locker
 */
export const createLockerValidator = vine.compile(
  vine.object({
    store_id: vine.number().positive(),
    code: vine.string().trim().minLength(2).maxLength(20),
    size: vine.enum(['P', 'M', 'G'] as const),
    metadata: vine.object({}).optional(),
  })
)

// Create a separate validator function that handles unique validation
export const validateCreateLocker = async (data: any) => {
  // First validate the structure
  const validated = await createLockerValidator.validate(data)

  // Then check uniqueness of code
  const codeValidator = vine.compile(
    vine.object({
      code: vine.string().use(uniqueLockerCodeRule(validated.store_id)()),
    })
  )
  await codeValidator.validate({ code: validated.code })

  return validated
}

/**
 * Validator for updating a locker
 */
export const updateLockerValidator = vine.withMetaData<{ lockerId: number }>().compile(
  vine.object({
    code: vine.string().trim().minLength(2).maxLength(20).optional(),
    size: vine.enum(['P', 'M', 'G'] as const).optional(),
    metadata: vine.object({}).optional(),
  })
)

// Create a separate validator function for update that handles unique validation
export const validateUpdateLocker = async (data: any, lockerId: number) => {
  // First validate the structure
  const validated = await updateLockerValidator.validate(data, { meta: { lockerId } })

  // Then check uniqueness of code if provided
  if (validated.code) {
    const codeValidator = vine.compile(
      vine.object({
        code: vine.string().use(uniqueLockerCodeForUpdateRule(lockerId)()),
      })
    )
    await codeValidator.validate({ code: validated.code })
  }

  return validated
}

/**
 * Validator for listing lockers with pagination
 */
export const listLockersValidator = createPaginationValidator({
  store_id: vine.number().positive().optional(),
  status: vine.enum(['available', 'occupied', 'maintenance'] as const).optional(),
  size: vine.enum(['P', 'M', 'G'] as const).optional(),
})

/**
 * Validator for setting locker maintenance
 */
export const maintenanceLockerValidator = vine.compile(
  vine.object({
    reason: vine.string().trim().minLength(10).maxLength(500),
    estimated_return_date: vine.date().afterField('today').optional(),
  })
)

/**
 * Validator for batch creating lockers
 */
export const batchCreateLockersValidator = vine.compile(
  vine.object({
    store_id: vine.number().positive(),
    prefix: vine.string().trim().minLength(1).maxLength(10),
    start_number: vine.number().positive(),
    count: vine.number().positive().max(100),
    size: vine.enum(['P', 'M', 'G'] as const),
  })
)

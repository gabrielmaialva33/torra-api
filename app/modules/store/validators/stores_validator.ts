import vine from '@vinejs/vine'
import { createPaginationValidator } from '#shared/validators/pagination_validator'

export const createStoreValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    code: vine
      .string()
      .trim()
      .minLength(3)
      .maxLength(50)
      .unique(async (db, value) => {
        const store = await db.from('stores').where('code', value).first()
        return !store
      }),
    address: vine.object({
      street: vine.string().trim().minLength(3),
      number: vine.string().trim(),
      complement: vine.string().trim().optional(),
      neighborhood: vine.string().trim(),
      city: vine.string().trim(),
      state: vine.string().trim().maxLength(2),
      zip_code: vine
        .string()
        .trim()
        .regex(/^\d{5}-?\d{3}$/),
    }),
    phone: vine
      .string()
      .trim()
      .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/),
    email: vine.string().email().trim(),
    metadata: vine.object({}).optional(),
  })
)

export const updateStoreValidator = vine.withMetaData<{ storeId: number }>().compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(255).optional(),
    address: vine
      .object({
        street: vine.string().trim().minLength(3).optional(),
        number: vine.string().trim().optional(),
        complement: vine.string().trim().optional(),
        neighborhood: vine.string().trim().optional(),
        city: vine.string().trim().optional(),
        state: vine.string().trim().maxLength(2).optional(),
        zip_code: vine
          .string()
          .trim()
          .regex(/^\d{5}-?\d{3}$/)
          .optional(),
      })
      .optional(),
    phone: vine
      .string()
      .trim()
      .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/)
      .optional(),
    email: vine.string().email().trim().optional(),
    is_active: vine.boolean().optional(),
    metadata: vine.object({}).optional(),
  })
)

export const assignUserValidator = vine.compile(
  vine.object({
    user_id: vine.number().positive(),
    role: vine.enum(['manager', 'operator']),
  })
)

/**
 * Validator for listing stores with pagination
 */
export const listStoresValidator = createPaginationValidator({
  is_active: vine.boolean().optional(),
  city: vine.string().trim().optional(),
  state: vine.string().trim().maxLength(2).optional(),
})

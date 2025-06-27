import vine from '@vinejs/vine'

/**
 * Base pagination validator that can be extended or used directly
 */
export const paginationSchema = vine.object({
  page: vine.number().positive().optional(),
  per_page: vine.number().positive().max(100).optional(),
  sort_by: vine.string().trim().optional(),
  order: vine.enum(['asc', 'desc']).optional(),
  search: vine.string().trim().optional(),
})

/**
 * Create a pagination validator with additional fields
 */
export function createPaginationValidator(additionalFields?: any) {
  return vine.compile(
    vine.object({
      ...paginationSchema.getProperties(),
      ...(additionalFields || {}),
    })
  )
}

/**
 * Standard pagination validator
 */
export const paginationValidator = vine.compile(paginationSchema)

/**
 * Helper to extract pagination params with defaults
 */
export interface PaginationParams {
  page: number
  perPage: number
  sortBy: string
  direction: 'asc' | 'desc'
  search?: string
}

export function extractPaginationParams(
  validated: any,
  defaults: {
    page?: number
    perPage?: number
    sortBy?: string
    direction?: 'asc' | 'desc'
  } = {}
): PaginationParams {
  return {
    page: validated.page || defaults.page || 1,
    perPage: validated.per_page || defaults.perPage || 20,
    sortBy: validated.sort_by || defaults.sortBy || 'id',
    direction: validated.order || defaults.direction || 'asc',
    search: validated.search,
  }
}

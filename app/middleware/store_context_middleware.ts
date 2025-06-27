import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { inject } from '@adonisjs/core'

import StoresRepository from '#modules/store/repositories/stores_repository'
import BadRequestException from '#exceptions/bad_request_exception'
import ForbiddenException from '#exceptions/forbidden_exception'

@inject()
export default class StoreContextMiddleware {
  constructor(private storesRepository: StoresRepository) {}

  async handle({ auth, request }: HttpContext, next: NextFn, options?: { required?: boolean }) {
    const user = auth.user!

    // Get store ID from header or query parameter
    const storeId = request.header('X-Store-Id') || request.input('store_id')

    if (!storeId && options?.required) {
      throw new BadRequestException('Store context is required')
    }

    if (storeId) {
      const store = await this.storesRepository.findBy('id', +storeId)

      if (!store) {
        throw new BadRequestException('Invalid store ID')
      }

      if (!store.is_active) {
        throw new BadRequestException('Store is not active')
      }

      // Load user stores to check access
      await user.load((loader) => {
        loader.load('stores')
      })
      const hasAccess = user.stores.some((s) => s.id === store.id)

      // Check if user is admin or has access to the store
      await user.load((loader) => {
        loader.load('roles')
      })
      const isAdmin = user.roles.some((role) => ['root', 'admin'].includes(role.slug))

      if (!isAdmin && !hasAccess) {
        throw new ForbiddenException('You do not have access to this store')
      }

      // Set store in the request context
      request.updateBody({ currentStore: store, currentStoreId: store.id })
    }

    return next()
  }
}

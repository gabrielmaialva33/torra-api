import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import ListStoresService from '#modules/store/services/list-stores/list_stores_service'
import GetStoreService from '#modules/store/services/get-store/get_store_service'
import CreateStoreService from '#modules/store/services/create-store/create_store_service'
import UpdateStoreService from '#modules/store/services/update-store/update_store_service'
import AssignUserToStoreService from '#modules/store/services/assign-user-to-store/assign_user_to_store_service'
import { extractPaginationParams } from '#shared/validators/pagination_validator'

import {
  createStoreValidator,
  updateStoreValidator,
  assignUserValidator,
  listStoresValidator,
} from '#modules/store/validators/stores_validator'

@inject()
export default class StoresController {
  async paginate({ request, response }: HttpContext) {
    const validated = await listStoresValidator.validate(request.all())
    const { page, perPage, sortBy, direction, search } = extractPaginationParams(validated, {
      sortBy: 'name',
    })

    const service = await app.container.make(ListStoresService)
    const stores = await service.run({
      page,
      perPage,
      sortBy,
      direction,
      modifyQuery: (query) => {
        if (validated.is_active !== undefined) {
          query.where('is_active', validated.is_active)
        }
        if (validated.city) {
          query.whereRaw("address->>'city' ILIKE ?", [`%${validated.city}%`])
        }
        if (validated.state) {
          query.whereRaw("address->>'state' = ?", [validated.state])
        }
        if (search) {
          query.where((subQuery) => {
            subQuery
              .where('name', 'ILIKE', `%${search}%`)
              .orWhere('code', 'ILIKE', `%${search}%`)
              .orWhere('email', 'ILIKE', `%${search}%`)
          })
        }
      },
    })

    return response.json(stores)
  }

  async get({ params, response }: HttpContext) {
    const storeId = +params.id

    const service = await app.container.make(GetStoreService)
    const store = await service.run(storeId)

    return response.json(store)
  }

  async getByCode({ params, response }: HttpContext) {
    const code = params.code

    const service = await app.container.make(GetStoreService)
    const store = await service.getByCode(code)

    return response.json(store)
  }

  async listActive({ response }: HttpContext) {
    const service = await app.container.make(ListStoresService)
    const stores = await service.listActiveStores()

    return response.json(stores)
  }

  async listByUser({ auth, response }: HttpContext) {
    const userId = auth.user!.id

    const service = await app.container.make(ListStoresService)
    const stores = await service.listByUser(userId)

    return response.json(stores)
  }

  async create({ request, response }: HttpContext) {
    const payload = await createStoreValidator.validate(request.all())

    const service = await app.container.make(CreateStoreService)
    const store = await service.run(payload)

    return response.created(store)
  }

  async update({ params, request, response }: HttpContext) {
    const storeId = +params.id
    const payload = await updateStoreValidator.validate(request.all(), { meta: { storeId } })

    const service = await app.container.make(UpdateStoreService)
    const store = await service.run(storeId, payload)

    return response.json(store)
  }

  async assignUser({ params, request, response }: HttpContext) {
    const storeId = +params.id
    const payload = await assignUserValidator.validate(request.all())

    const service = await app.container.make(AssignUserToStoreService)
    await service.run({
      store_id: storeId,
      user_id: payload.user_id,
      role: payload.role,
    })

    return response.noContent()
  }

  async removeUser({ params, response }: HttpContext) {
    const storeId = +params.id
    const userId = +params.userId

    const service = await app.container.make(AssignUserToStoreService)
    await service.remove(storeId, userId)

    return response.noContent()
  }

  async deactivateUser({ params, response }: HttpContext) {
    const storeId = +params.id
    const userId = +params.userId

    const service = await app.container.make(AssignUserToStoreService)
    await service.deactivate(storeId, userId)

    return response.noContent()
  }
}

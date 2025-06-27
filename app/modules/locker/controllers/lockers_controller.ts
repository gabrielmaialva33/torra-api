import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

import CreateLockerService from '#modules/locker/services/create-locker/create_locker_service'
import LockersRepository from '#modules/locker/repositories/lockers_repository'

import {
  createLockerValidator,
  updateLockerValidator,
  maintenanceLockerValidator,
  listLockersValidator,
} from '#modules/locker/validators/lockers_validator'

@inject()
export default class LockersController {
  constructor(private lockersRepository: LockersRepository) {}

  async paginate({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const perPage = request.input('per_page', 10)
    const sortBy = request.input('sort_by', 'id')
    const direction = request.input('order', 'asc')
    const search = request.input('search', undefined)

    const validated = await listLockersValidator.validate(request.all())

    const lockers = await this.lockersRepository.paginate({
      page,
      perPage,
      sortBy,
      direction,
      modifyQuery: (query) => {
        if (validated.store_id) {
          query.where('store_id', validated.store_id)
        }
        if (validated.status) {
          query.where('status', validated.status)
        }
        if (validated.size) {
          query.where('size', validated.size)
        }
        if (search) {
          query.where((subQuery) => {
            subQuery.where('code', 'ILIKE', `%${search}%`)
          })
        }
        query.preload('store').preload('currentOrder')
      },
    })

    return response.json(lockers)
  }

  async listByStore({ params, response }: HttpContext) {
    const storeId = +params.storeId

    const lockers = await this.lockersRepository.findByStore(storeId)

    return response.json(lockers)
  }

  async getAvailable({ params, request, response }: HttpContext) {
    const storeId = +params.storeId
    const size = request.input('size', undefined)

    const lockers = await this.lockersRepository.findAvailableLockers(storeId, size)

    return response.json(lockers)
  }

  async get({ params, response }: HttpContext) {
    const lockerId = +params.id

    const locker = await this.lockersRepository.findBy('id', lockerId, {
      modifyQuery: (query) => {
        query.preload('store').preload('currentOrder')
      },
    })

    if (!locker) {
      return response.notFound({ message: 'Locker not found' })
    }

    return response.json(locker)
  }

  async create({ request, response }: HttpContext) {
    const payload = await createLockerValidator.validate(request.all())

    const service = await app.container.make(CreateLockerService)
    const locker = await service.run(payload)

    return response.created(locker)
  }

  async update({ params, request, response }: HttpContext) {
    const lockerId = +params.id
    const payload = await updateLockerValidator.validate(request.all(), { meta: { lockerId } })

    const locker = await this.lockersRepository.findBy('id', lockerId)
    if (!locker) {
      return response.notFound({ message: 'Locker not found' })
    }

    Object.assign(locker, payload)
    await locker.save()

    return response.json(locker)
  }

  async setMaintenance({ params, request, response, auth }: HttpContext) {
    const lockerId = +params.id
    const payload = await maintenanceLockerValidator.validate(request.all())

    const locker = await this.lockersRepository.setMaintenance(lockerId, true)

    // Update metadata with maintenance info
    locker.metadata = {
      ...locker.metadata,
      maintenance: {
        reason: payload.reason,
        estimated_return: payload.estimated_return_date,
        set_by: auth.user!.id,
        set_at: new Date().toISOString(),
      },
    }
    await locker.save()

    return response.json(locker)
  }

  async removeMaintenance({ params, response, auth }: HttpContext) {
    const lockerId = +params.id

    const locker = await this.lockersRepository.setMaintenance(lockerId, false)

    // Update metadata
    locker.metadata = {
      ...locker.metadata,
      maintenance: {
        ...locker.metadata.maintenance,
        removed_by: auth.user!.id,
        removed_at: new Date().toISOString(),
      },
    }
    await locker.save()

    return response.json(locker)
  }
}

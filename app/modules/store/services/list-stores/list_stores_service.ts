import { inject } from '@adonisjs/core'
import StoresRepository from '#modules/store/repositories/stores_repository'
import { PaginateOptions } from '#shared/lucid/lucid_repository_interface'

@inject()
export default class ListStoresService {
  constructor(private storesRepository: StoresRepository) {}

  async run(options?: PaginateOptions<typeof import('#modules/store/models/store').default>) {
    return this.storesRepository.paginate({
      ...options,
      modifyQuery: (query) => {
        query.preload('lockers')
        options?.modifyQuery?.(query)
      },
    })
  }

  async listActiveStores() {
    return this.storesRepository.findActiveStores()
  }

  async listByUser(userId: number) {
    return this.storesRepository.findStoresByUser(userId)
  }
}

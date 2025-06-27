import { inject } from '@adonisjs/core'
import StoresRepository from '#modules/store/repositories/stores_repository'
import Store from '#modules/store/models/store'
import NotFoundException from '#exceptions/not_found_exception'

@inject()
export default class GetStoreService {
  constructor(private storesRepository: StoresRepository) {}

  async run(storeId: number): Promise<Store> {
    const store = await this.storesRepository.findBy('id', storeId, {
      modifyQuery: (query) => {
        query
          .preload('lockers')
          .preload('users')
          .preload('orders', (ordersQuery) => {
            ordersQuery.limit(10).orderBy('created_at', 'desc')
          })
      },
    })

    if (!store) {
      throw new NotFoundException('Store not found')
    }

    return store
  }

  async getByCode(code: string): Promise<Store> {
    const store = await this.storesRepository.findByCode(code)

    if (!store) {
      throw new NotFoundException('Store not found')
    }

    return store
  }
}

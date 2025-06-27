import { inject } from '@adonisjs/core'
import StoresRepository from '#modules/store/repositories/stores_repository'
import IStore from '#modules/store/interfaces/store_interface'
import Store from '#modules/store/models/store'
import NotFoundException from '#exceptions/not_found_exception'

@inject()
export default class UpdateStoreService {
  constructor(private storesRepository: StoresRepository) {}

  async run(storeId: number, payload: IStore.UpdateStoreData): Promise<Store> {
    const store = await this.storesRepository.findBy('id', storeId)

    if (!store) {
      throw new NotFoundException('Store not found')
    }

    Object.assign(store, payload)
    await store.save()

    return store
  }
}

import { inject } from '@adonisjs/core'
import StoresRepository from '#modules/store/repositories/stores_repository'
import IStore from '#modules/store/interfaces/store_interface'

@inject()
export default class CreateStoreService {
  constructor(private storesRepository: StoresRepository) {}

  async run(payload: IStore.CreateStoreData) {
    return this.storesRepository.create(payload)
  }
}

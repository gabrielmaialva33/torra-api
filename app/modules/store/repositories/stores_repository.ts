import LucidRepository from '#shared/lucid/lucid_repository'
import Store from '#modules/store/models/store'
import IStore from '#modules/store/interfaces/store_interface'

export default class StoresRepository
  extends LucidRepository<typeof Store>
  implements IStore.Repository
{
  constructor() {
    super(Store)
  }

  async findByCode(code: string): Promise<Store | null> {
    return this.findBy('code', code, {
      modifyQuery: (query) => {
        query.preload('lockers')
      },
    })
  }

  async findActiveStores(): Promise<Store[]> {
    return this.list({
      modifyQuery: (query) => {
        query.where('is_active', true).orderBy('name', 'asc')
      },
    })
  }

  async findStoresByUser(userId: number): Promise<Store[]> {
    const stores = await Store.query()
      .whereHas('users', (query) => {
        query.where('users.id', userId).where('user_stores.is_active', true)
      })
      .where('is_active', true)
      .preload('lockers')
      .orderBy('name', 'asc')

    return stores
  }
}

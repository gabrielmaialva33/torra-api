import LucidRepository from '#shared/lucid/lucid_repository'
import Locker from '#modules/locker/models/locker'
import ILocker from '#modules/locker/interfaces/locker_interface'

export default class LockersRepository
  extends LucidRepository<typeof Locker>
  implements ILocker.Repository
{
  constructor() {
    super(Locker)
  }

  async findByCode(storeId: number, code: string): Promise<Locker | null> {
    return Locker.query()
      .where('store_id', storeId)
      .where('code', code)
      .preload('store')
      .preload('currentOrder')
      .first()
  }

  async findAvailableLockers(storeId: number, size?: ILocker.Size): Promise<Locker[]> {
    const query = Locker.query().where('store_id', storeId).where('status', 'available')

    if (size) {
      query.where('size', size)
    }

    return query.orderBy('code', 'asc')
  }

  async findByStore(storeId: number): Promise<Locker[]> {
    return Locker.query().where('store_id', storeId).preload('currentOrder').orderBy('code', 'asc')
  }

  async occupyLocker(lockerId: number, orderId: number): Promise<Locker> {
    const locker = await Locker.findOrFail(lockerId)

    locker.status = 'occupied'
    locker.current_order_id = orderId

    await locker.save()

    return locker
  }

  async releaseLocker(lockerId: number): Promise<Locker> {
    const locker = await Locker.findOrFail(lockerId)

    locker.status = 'available'
    locker.current_order_id = null

    await locker.save()

    return locker
  }

  async setMaintenance(lockerId: number, inMaintenance: boolean): Promise<Locker> {
    const locker = await Locker.findOrFail(lockerId)

    locker.status = inMaintenance ? 'maintenance' : 'available'

    if (!inMaintenance) {
      locker.current_order_id = null
    }

    await locker.save()

    return locker
  }
}

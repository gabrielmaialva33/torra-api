import { inject } from '@adonisjs/core'
import LockersRepository from '#modules/locker/repositories/lockers_repository'
import ILocker from '#modules/locker/interfaces/locker_interface'

@inject()
export default class CreateLockerService {
  constructor(private lockersRepository: LockersRepository) {}

  async run(payload: ILocker.CreateLockerData) {
    return this.lockersRepository.create(payload)
  }
}

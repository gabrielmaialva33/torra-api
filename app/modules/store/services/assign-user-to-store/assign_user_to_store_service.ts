import { inject } from '@adonisjs/core'
import StoresRepository from '#modules/store/repositories/stores_repository'
import UsersRepository from '#modules/user/repositories/users_repository'
import IStore from '#modules/store/interfaces/store_interface'
import NotFoundException from '#exceptions/not_found_exception'

@inject()
export default class AssignUserToStoreService {
  constructor(
    private storesRepository: StoresRepository,
    private usersRepository: UsersRepository
  ) {}

  async run(data: IStore.AssignUserData): Promise<void> {
    const store = await this.storesRepository.findBy('id', data.store_id)
    if (!store) {
      throw new NotFoundException('Store not found')
    }

    const user = await this.usersRepository.findBy('id', data.user_id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Check if user is already assigned
    await store.load('users')
    const existingAssignment = store.users.find((u) => u.id === data.user_id)

    if (existingAssignment) {
      // Update role if already assigned
      await store.related('users').sync(
        {
          [data.user_id]: {
            role: data.role,
            is_active: true,
          },
        },
        false
      )
    } else {
      // Create new assignment
      await store.related('users').attach({
        [data.user_id]: {
          role: data.role,
          is_active: true,
        },
      })
    }
  }

  async remove(storeId: number, userId: number): Promise<void> {
    const store = await this.storesRepository.findBy('id', storeId)
    if (!store) {
      throw new NotFoundException('Store not found')
    }

    await store.related('users').detach([userId])
  }

  async deactivate(storeId: number, userId: number): Promise<void> {
    const store = await this.storesRepository.findBy('id', storeId)
    if (!store) {
      throw new NotFoundException('Store not found')
    }

    await store.related('users').sync(
      {
        [userId]: {
          is_active: false,
        },
      },
      false
    )
  }
}

import LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import Store from '#modules/store/models/store'

namespace IStore {
  export interface Repository extends LucidRepositoryInterface<typeof Store> {
    findByCode(code: string): Promise<Store | null>

    findActiveStores(): Promise<Store[]>

    findStoresByUser(userId: number): Promise<Store[]>
  }

  export interface CreateStoreData {
    name: string
    code: string
    address: {
      street: string
      number: string
      complement?: string
      neighborhood: string
      city: string
      state: string
      zip_code: string
    }
    phone: string
    email: string
    metadata?: Record<string, any>
  }

  export interface UpdateStoreData {
    name?: string
    address?: {
      street?: string
      number?: string
      complement?: string
      neighborhood?: string
      city?: string
      state?: string
      zip_code?: string
    }
    phone?: string
    email?: string
    is_active?: boolean
    metadata?: Record<string, any>
  }

  export interface AssignUserData {
    store_id: number
    user_id: number
    role: 'manager' | 'operator'
  }

  export interface StoreMetrics {
    total_orders: number
    pending_orders: number
    stored_orders: number
    retrieved_orders: number
    cancelled_orders: number
    expired_orders: number
    available_lockers: number
    occupied_lockers: number
    maintenance_lockers: number
  }

  export interface StoreFilters {
    is_active?: boolean
    city?: string
    state?: string
    search?: string
  }
}

export default IStore

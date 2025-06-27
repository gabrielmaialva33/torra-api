import LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import type { LockerSize, LockerStatus } from '#modules/locker/models/locker'
import Locker from '#modules/locker/models/locker'

namespace ILocker {
  export interface Repository extends LucidRepositoryInterface<typeof Locker> {
    findByCode(storeId: number, code: string): Promise<Locker | null>

    findAvailableLockers(storeId: number, size?: LockerSize): Promise<Locker[]>

    findByStore(storeId: number): Promise<Locker[]>

    occupyLocker(lockerId: number, orderId: number): Promise<Locker>

    releaseLocker(lockerId: number): Promise<Locker>

    setMaintenance(lockerId: number, inMaintenance: boolean): Promise<Locker>
  }

  export enum Size {
    SMALL = 'P',
    MEDIUM = 'M',
    LARGE = 'G',
  }

  export enum Status {
    AVAILABLE = 'available',
    OCCUPIED = 'occupied',
    MAINTENANCE = 'maintenance',
  }

  export interface CreateLockerData {
    store_id: number
    code: string
    size: LockerSize
    metadata?: Record<string, any>
  }

  export interface UpdateLockerData {
    status?: LockerStatus
    metadata?: Record<string, any>
  }

  export interface LockerFilters {
    store_id?: number
    size?: LockerSize
    status?: LockerStatus
    search?: string // searches in code
  }

  export interface LockerStats {
    total: number
    available: number
    occupied: number
    maintenance: number
    by_size: {
      P: { total: number; available: number; occupied: number; maintenance: number }
      M: { total: number; available: number; occupied: number; maintenance: number }
      G: { total: number; available: number; occupied: number; maintenance: number }
    }
  }

  export interface AllocateLockerData {
    order_id: number
    size_preference?: LockerSize
  }

  export interface ReleaseLockerData {
    locker_id: number
    reason: 'retrieved' | 'cancelled' | 'expired' | 'manual'
    user_id: number
  }

  export interface MaintenanceData {
    locker_id: number
    reason: string
    estimated_return?: Date
    user_id: number
  }

  /**
   * Get the next available size if preferred size is not available
   */
  export function getNextAvailableSize(preferredSize: LockerSize): LockerSize[] {
    const sizeOrder: Record<LockerSize, LockerSize[]> = {
      P: ['M', 'G'],
      M: ['G', 'P'],
      G: ['M', 'P'],
    }
    return sizeOrder[preferredSize]
  }

  /**
   * Check if a locker can accommodate an order based on size
   */
  export function canAccommodateOrder(lockerSize: LockerSize, orderSize: LockerSize): boolean {
    const sizeHierarchy = { P: 1, M: 2, G: 3 }
    return sizeHierarchy[lockerSize] >= sizeHierarchy[orderSize]
  }
}

export default ILocker

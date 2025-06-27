import LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import Customer from '#modules/customer/models/customer'

namespace ICustomer {
  export interface Repository extends LucidRepositoryInterface<typeof Customer> {
    findByCpf(cpf: string): Promise<Customer | null>

    findByEmail(email: string): Promise<Customer | null>

    findByPhone(phone: string): Promise<Customer | null>
  }

  export interface CreateCustomerData {
    name: string
    cpf: string
    email: string
    phone: string
    metadata?: {
      [key: string]: any // Flexible metadata structure
    }
  }

  export interface UpdateCustomerData {
    name?: string
    email?: string
    phone?: string
    metadata?: {
      [key: string]: any // Flexible metadata structure
    }
  }

  export interface CustomerFilters {
    search?: string // searches in name, cpf, email, phone
    created_from?: Date
    created_to?: Date
  }

  export interface CustomerOrderStats {
    total_orders: number
    pending_orders: number
    retrieved_orders: number
    cancelled_orders: number
    expired_orders: number
  }

  /**
   * Validate CPF format and checksum
   */
  export function validateCpf(cpf: string): boolean {
    // Remove non-numeric characters
    cpf = cpf.replace(/\D/g, '')

    if (cpf.length !== 11) return false

    // Check for known invalid patterns
    if (/^(\d)\1+$/.test(cpf)) return false

    // Validate checksum
    let sum = 0
    let remainder

    for (let i = 1; i <= 9; i++) {
      sum += Number.parseInt(cpf.substring(i - 1, i)) * (11 - i)
    }

    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== Number.parseInt(cpf.substring(9, 10))) return false

    sum = 0
    for (let i = 1; i <= 10; i++) {
      sum += Number.parseInt(cpf.substring(i - 1, i)) * (12 - i)
    }

    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== Number.parseInt(cpf.substring(10, 11))) return false

    return true
  }

  /**
   * Format CPF for display
   */
  export function formatCpf(cpf: string): string {
    cpf = cpf.replace(/\D/g, '')
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  /**
   * Clean CPF (remove formatting)
   */
  export function cleanCpf(cpf: string): string {
    return cpf.replace(/\D/g, '')
  }

  /**
   * Format phone for display
   */
  export function formatPhone(phone: string): string {
    phone = phone.replace(/\D/g, '')
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  /**
   * Clean phone (remove formatting)
   */
  export function cleanPhone(phone: string): string {
    return phone.replace(/\D/g, '')
  }
}

export default ICustomer

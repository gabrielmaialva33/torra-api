import LucidRepositoryInterface from '#shared/lucid/lucid_repository_interface'
import Role from '#modules/role/models/role'

namespace IRole {
  export interface Repository extends LucidRepositoryInterface<typeof Role> {}

  export enum Slugs {
    ROOT = 'root',
    ADMIN = 'admin',
    STORE_MANAGER = 'store_manager',
    STORE_OPERATOR = 'store_operator',
    USER = 'user',
    GUEST = 'guest',
    EDITOR = 'editor',
  }

  export interface RoleHierarchy {
    [key: string]: string[]
  }

  export const ROLE_HIERARCHY: RoleHierarchy = {
    [Slugs.ROOT]: [
      Slugs.ADMIN,
      Slugs.STORE_MANAGER,
      Slugs.STORE_OPERATOR,
      Slugs.USER,
      Slugs.GUEST,
      Slugs.EDITOR,
    ],
    [Slugs.ADMIN]: [
      Slugs.STORE_MANAGER,
      Slugs.STORE_OPERATOR,
      Slugs.USER,
      Slugs.GUEST,
      Slugs.EDITOR,
    ],
    [Slugs.STORE_MANAGER]: [Slugs.STORE_OPERATOR, Slugs.USER],
    [Slugs.STORE_OPERATOR]: [Slugs.USER],
    [Slugs.EDITOR]: [Slugs.USER],
    [Slugs.USER]: [Slugs.GUEST],
    [Slugs.GUEST]: [],
  }
}

export default IRole

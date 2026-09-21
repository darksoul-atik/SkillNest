export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export const USER_ROLES = [UserRole.USER, UserRole.ADMIN] as const;

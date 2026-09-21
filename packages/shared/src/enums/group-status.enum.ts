export enum GroupStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export const GROUP_STATUSES = [
  GroupStatus.ACTIVE,
  GroupStatus.CANCELLED,
  GroupStatus.EXPIRED,
] as const;

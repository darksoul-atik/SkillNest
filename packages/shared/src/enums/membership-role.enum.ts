export enum MembershipRole {
  HOST = 'host',
  MEMBER = 'member',
}

export const MEMBERSHIP_ROLES = [
  MembershipRole.HOST,
  MembershipRole.MEMBER,
] as const;

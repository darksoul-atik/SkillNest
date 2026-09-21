export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
}

export const AUTH_PROVIDERS = [
  AuthProvider.LOCAL,
  AuthProvider.GOOGLE,
  AuthProvider.GITHUB,
] as const;

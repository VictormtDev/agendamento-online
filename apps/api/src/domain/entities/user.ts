export const ROLES = ['CLIENT', 'PROVIDER'] as const;
export type Role = (typeof ROLES)[number];

export const MIN_PASSWORD_LENGTH = 8;
// bcrypt silently ignores everything past 72 bytes, so longer passwords would give a false sense of security.
export const MAX_PASSWORD_LENGTH = 72;

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  /** IANA name; availability is interpreted in it. */
  timezone: string;
  createdAt: Date;
}

export type UserProfile = Omit<User, 'passwordHash'>;

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    timezone: user.timezone,
    createdAt: user.createdAt,
  };
}

// Emails are compared case-insensitively: "Ana@Mail.com" and "ana@mail.com" are the same account.
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

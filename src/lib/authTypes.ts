export type AuthUser = {
  id: string;
  email: string | null;
  name: string;
  image?: string;
  isGuest: boolean;
  createdAt: number;
  lastLoginAt: number;
};

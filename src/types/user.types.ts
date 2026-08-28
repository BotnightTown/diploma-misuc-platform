import { email } from "zod";

export type UserType = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  bio: string | null;
  avatar_url: string;
  role: "listener" | "moderator" | "admin";
  created_at: Date;
  updated_at: Date;
  is_verified: boolean;
};

export type PublicUser = Pick<
  UserType,
  "id" | "username" | "email" | "avatar_url" | "bio" | "role" | "is_verified" | "created_at"
>;

export interface UserAvatarUploadData {
  file: Buffer;
  filename: string;
  contentType: string;
  size: number;
}

export type AuthenticatedUser = Omit<UserType, "password_hash">;

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  avatar_url: true,
  bio: true,
  role: true,
  is_verified: true,
  created_at: true,
};

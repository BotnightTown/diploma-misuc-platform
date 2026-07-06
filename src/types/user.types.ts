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

export type PublicUser = Pick<UserType, "id" | "username" | "email" | "avatar_url">;

export interface UserAvatarUploadData {
  file: Buffer;
  filename: string;
  contentType: string;
  size: number;
}

export type AuthenticatedUser = Omit<UserType, "password_hash">;

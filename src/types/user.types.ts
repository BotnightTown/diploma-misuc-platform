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

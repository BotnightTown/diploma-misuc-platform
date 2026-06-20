import { z } from "zod";

export const createUserSchema = z.object({
  username: z.string().min(1, { message: "Username cannot be empty" }),
  email: z.email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^(?=.*[a-zA-Z]).+$/, {
      message: "Password must contain at least one letter",
    })
    .regex(/\d/, { message: "Password must contain at least one number" })
    .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>]).+$/, {
      message: "Password must contain at least one special character",
    }),
  bio: z.string().min(1, { message: "Biography cannot be empty" }),
});

export const loginUserSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "Username or email is required" })
    .trim(),
  password: z.string().min(1, { message: "Password is required" }),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, { message: "Refresh token is required" }),
});

export const logoutSchema = z.object({
  refresh_token: z.string().min(1, { message: "Refresh token is required" }),
  access_token: z.string().min(1, { message: "Access token is required" }),
});

export type CreateUserType = z.infer<typeof createUserSchema>;
export type LoginUserType = z.infer<typeof loginUserSchema>;
export type RefreshTokenType = z.infer<typeof refreshTokenSchema>;
export type LogoutType = z.infer<typeof logoutSchema>;

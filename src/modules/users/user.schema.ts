import { z } from "zod";

export const updateUsernameSchema = z.object({
  username: z.string().min(1, { message: "Username cannot be empty" }),
});

export const updateBioSchema = z.object({
  bio: z.string().nullable(),
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, { message: "Current password is required" }),
  new_password: z
    .string()
    .min(8, { message: "New password must be at least 8 characters long" })
    .regex(/^(?=.*[a-zA-Z]).+$/, {
      message: "Must contain at least one letter",
    })
    .regex(/\d/, { message: "Must contain at least one number" })
    .regex(/^(?=.*[!@#$%^&*(),.?":{}|<>]).+$/, {
      message: "Must contain at least one special character",
    }),
});

export const changeEmailSchema = z.object({
  password: z.string().min(1, { message: "Password is required to change email" }),
  new_email: z.email({ message: "Invalid email format" }),
});

export type UpdateUsernameType = z.infer<typeof updateUsernameSchema>;
export type UpdateBioType = z.infer<typeof updateBioSchema>;
export type ChangePasswordType = z.infer<typeof changePasswordSchema>;
export type ChangeEmailType = z.infer<typeof changeEmailSchema>;

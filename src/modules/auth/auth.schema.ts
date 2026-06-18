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

export type CreateUserType = z.infer<typeof createUserSchema>;

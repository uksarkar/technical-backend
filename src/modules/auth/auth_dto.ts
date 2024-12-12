import { z } from "zod";

export const loginDto = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(4, "Password must be at least 4 characters")
    .max(20, "Password must not exceed 20 characters")
});

export const registerDto = loginDto.extend({
  name: z
    .string()
    .min(4, "Name must be at least 4 characters")
    .max(255, "Name must not exceed 255 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain alphabets and spaces")
});

export type LoginDto = z.infer<typeof loginDto>;
export type RegisterDto = z.infer<typeof registerDto>;

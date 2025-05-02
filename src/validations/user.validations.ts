import { z } from "zod";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(20, { message: "Username must be at most 20 characters long" }),

  email: z.string().email({ message: "Invalid email address" }),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(16, { message: "Password must be at most 16 characters long" })
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/, {
      message:
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character.",
    }),

  avatar: z.string().optional(),
  fullName: z
    .string()
    .min(6, { message: "Full name must be at least 6 characters long" })
    .max(20, { message: "Full name must be at most 20 characters long" })
    .optional(),
});

const loginSchema = registerSchema.pick({
  email: true,
  password: true,
});

const emailSchema = registerSchema.pick({
  email: true,
});

const resetPasswordSchema = registerSchema
  .pick({ password: true })
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;
type EmailData = z.infer<typeof emailSchema>;
type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

const validateRegisterData = (data: RegisterData) => {
  return registerSchema.safeParse(data);
};

const validateLoginData = (data: LoginData) => {
  return loginSchema.safeParse(data);
};

const validateEmail = (data: EmailData) => {
  return emailSchema.safeParse(data);
};

const validateResetPasswordData = (data: ResetPasswordData) => {
  return resetPasswordSchema.safeParse(data);
};

export {
  validateRegisterData,
  validateLoginData,
  validateEmail,
  validateResetPasswordData,
};

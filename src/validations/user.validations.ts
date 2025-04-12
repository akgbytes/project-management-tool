import { z } from "zod";

const registerSchema = z.object({
  username: z
    .string()
    .nonempty()
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
  fullName: z.string().optional(),
  avatar: z.string().url({ message: "Invalid avatar url" }).optional(),
});

const loginSchema = registerSchema.omit({ fullName: true, username: true });

type registerData = Zod.infer<typeof registerSchema>;
type loginData = Zod.infer<typeof loginSchema>;

const validateRegisterData = (data: registerData) => {
  return registerSchema.safeParse(data);
};

const validateLoginData = (data: loginData) => {
  return loginSchema.safeParse(data);
};

export { validateLoginData, validateRegisterData };

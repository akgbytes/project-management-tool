import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const createEnv = (env: NodeJS.ProcessEnv) => {
  const envSchema = z.object({
    PORT: z.coerce.number().default(8080),
    MONGO_URI: z.string().nonempty(),

    MAILTRAP_HOST: z.string().nonempty(),
    MAILTRAP_PORT: z.coerce.number(),
    MAILTRAP_USERNAME: z.string().nonempty(),
    MAILTRAP_PASSWORD: z.string().nonempty(),
    MAILTRAP_SENDERMAIL: z.string().email(),

    SERVER_URL: z.string().url(),
    CLIENT_URL: z.string().url(),

    ACCESS_TOKEN_SECRET: z.string().nonempty(),
    ACCESS_TOKEN_EXPIRY: z.string().default("1d"),

    REFRESH_TOKEN_SECRET: z.string().nonempty(),
    REFRESH_TOKEN_EXPIRY: z.string().default("7d"),

    CLOUDINARY_NAME: z.string().nonempty(),
    CLOUDINARY_API_KEY: z.string().nonempty(),
    CLOUDINARY_SECRET_KEY: z.string().nonempty(),

    MAX_ATTACHMENTS: z.coerce.number().positive(),
    NODE_ENV: z.string().nonempty(),
  });

  const validationResult = envSchema.safeParse(env);

  if (validationResult.success) {
    return validationResult.data;
  } else {
    const errorMessage = validationResult.error.errors
      .map((err) => `${err.path.join(".")} :  ${err.message}`)
      .join("\n");

    throw new Error(errorMessage);
  }
};

const env = createEnv(process.env);
export { env };

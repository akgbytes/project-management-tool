import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const createEnv = (env: NodeJS.ProcessEnv) => {
  const envSchema = z.object({
    PORT: z.coerce.number(),
    MONGO_URI: z.string().nonempty(),

    MAILTRAP_HOST: z.string().nonempty(),
    MAILTRAP_PORT: z.string().nonempty(),
    MAILTRAP_USERNAME: z.string().nonempty(),
    MAILTRAP_PASSWORD: z.string().nonempty(),
    MAILTRAP_SENDERMAIL: z.string().nonempty(),

    APP_URL: z.string(),

    ACCESS_TOKEN_SECRET: z.string().nonempty(),
    ACCESS_TOKEN_EXPIRY: z.string().default("5m"),

    REFRESH_TOKEN_SECRET: z.string().nonempty(),
    REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
  });

  const validationResult = envSchema.safeParse(env);

  if (validationResult.success) {
    return validationResult.data;
  } else {
    const errorMessage = validationResult.error.errors
      .map((err) => `${err.path.join(".")} :  ${err.message}`)
      .join(", ");

    throw new Error(errorMessage);
  }
};

const env = createEnv(process.env);
export { env };

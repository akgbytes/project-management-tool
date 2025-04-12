import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const createEnv = (env: NodeJS.ProcessEnv) => {
  const envSchema = z.object({
    PORT: z.string().optional().default("8080"),
    MONGO_URI: z.string().nonempty(),
    MAILTRAP_HOST: z.string().nonempty(),
    MAILTRAP_PORT: z.string().nonempty(),
    MAILTRAP_USERNAME: z.string().nonempty(),
    MAILTRAP_PASSWORD: z.string().nonempty(),
    MAILTRAP_SENDERMAIL: z.string().nonempty(),
    APP_URL: z.string(),
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

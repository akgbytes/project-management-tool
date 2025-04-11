import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const createEnv = (env: NodeJS.ProcessEnv) => {
  const envSchema = z.object({
    PORT: z.string().optional().default("8080"),
    MONGO_URI: z.string().nonempty(),
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

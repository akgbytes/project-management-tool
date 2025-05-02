import app from "./app";
import { env } from "./configs/env";
import { connectDb } from "./configs/db";
import logger from "./utils/logger";

connectDb();
const PORT: number = env.PORT;

app.listen(PORT, () => {
  logger.info("Server successfully running on port: %d", PORT);
});

import mongoose from "mongoose";
import { env } from "./env";
import logger from "../utils/logger";

const connectDb = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info("MongoDB connected successfully!");
  } catch (error: any) {
    if (error instanceof Error) {
      logger.error(`Error connecting mongoDB: ${error.message}`);
    } else {
      logger.error(`Unknown database error: ${error.message}`);
    }
    process.exit(1);
  }
};

export { connectDb };

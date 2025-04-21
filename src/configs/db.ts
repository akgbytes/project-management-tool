import mongoose from "mongoose";
import { env } from "./env";

const connectDb = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB connected successfully!");
  } catch (error) {
    if (error instanceof Error) {
      console.log("Error connecting mongoDB : ", error.message);
    } else {
      console.log("Unknown database error : ", error);
    }
    process.exit(1);
  }
};

export { connectDb };

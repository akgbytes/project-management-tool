import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import { env } from "./configs/env";
import { connectDb } from "./configs/db";

connectDb();

const PORT: number = +env.PORT;

app.listen(PORT, () => {
  console.log("Server successfully running on port :", PORT);
});

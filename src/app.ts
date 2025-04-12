import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

import healthCheckRouter from "./routes/healthCheck.routes";
app.use("/api/v1/healthcheck", healthCheckRouter);

import userRouter from "./routes/user.routes";
import { errorHandler } from "./middlewares/error.middlewares";
app.use("/api/v1/user", userRouter);

app.use(errorHandler);
export default app;

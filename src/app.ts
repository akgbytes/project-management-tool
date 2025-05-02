import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

import healthCheckRouter from "./routes/healthCheck.routes";
import authRouter from "./routes/auth.routes";
import projectRouter from "./routes/project.routes";
import { errorHandler } from "./middlewares/error.middlewares";
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/users/auth", authRouter);
app.use("/api/v1/projects", projectRouter);
app.use(errorHandler);

export default app;

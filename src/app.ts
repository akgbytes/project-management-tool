import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
app.use(express.static("public"));

import healthCheckRouter from "./routes/healthCheck.routes";
import userRouter from "./routes/user.routes";
import projectRouter from "./routes/project.routes";
import noteRouter from "./routes/note.routes";
import taskRouter from "./routes/task.routes";
import { errorHandler } from "./middlewares/error.middlewares";
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/task", taskRouter);
app.use("/api/v1/note", noteRouter);

app.use(errorHandler);
export default app;

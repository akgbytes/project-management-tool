import { z } from "zod";
import { ProjectStatus } from "../utils/constants";

const taskSchema = z.object({
  title: z.string().trim().nonempty("Task title is required"),
  description: z.string().trim().nonempty("Task description is required"),
  email: z.string().email(),
  status: z.enum(
    [ProjectStatus.PLANNING, ProjectStatus.ONGOING, ProjectStatus.COMPLETED],
    { message: "Status must be either 'planning' or 'ongoing' or 'completed'" }
  ),
});

export type TaskData = z.infer<typeof taskSchema>;

export const validateTaskData = (data: TaskData) => taskSchema.safeParse(data);

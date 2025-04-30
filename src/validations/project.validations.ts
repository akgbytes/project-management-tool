import { z } from "zod";
import { UserRole } from "../utils/constants";

const createProjectSchema = z.object({
  name: z.string().trim().nonempty("Project name is required"),
  description: z.string().trim().nonempty("Project description is required"),
});

const addProjectMemberSchema = z.object({
  role: z.enum([UserRole.ProjectManager, UserRole.Member], {
    message: "Role must be either 'project_manager' or 'member'",
  }),

  email: z.string().email({ message: "Invalid email address" }),
});

const removeProjectMemberSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

const updateProjectSchema = createProjectSchema.partial();

export type ProjectData = z.infer<typeof createProjectSchema>;
export type ProjectMemberData = z.infer<typeof addProjectMemberSchema>;
export type RemoveProjectMemberData = z.infer<typeof removeProjectMemberSchema>;

export const validateProjectData = (data: ProjectData) =>
  createProjectSchema.safeParse(data);

export const validateUpdateProjectData = (data: Partial<ProjectData>) =>
  updateProjectSchema.safeParse(data);

export const validateProjectMemberData = (data: ProjectMemberData) =>
  addProjectMemberSchema.safeParse(data);

export const validateRemoveProjectMemberData = (
  data: RemoveProjectMemberData
) => removeProjectMemberSchema.safeParse(data);

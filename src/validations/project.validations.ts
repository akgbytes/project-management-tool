import { z } from "zod";
import { UserRole } from "../utils/constants";

const createProjectSchema = z.object({
  name: z.string().trim().nonempty("Project name is required"),
  description: z.string().trim().nonempty("Project description is required"),
});

const addProjectMemberSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum([UserRole.ProjectManager, UserRole.Member], {
    message: "Role must be either 'project_manager' or 'member'",
  }),
});

const updateMemberRoleSchema = addProjectMemberSchema.pick({ role: true });

const updateProjectSchema = createProjectSchema.partial();

export type ProjectData = z.infer<typeof createProjectSchema>;
export type ProjectMemberData = z.infer<typeof addProjectMemberSchema>;
export type UpdateMemberRoleData = z.infer<typeof updateMemberRoleSchema>;

export const validateProjectData = (data: ProjectData) =>
  createProjectSchema.safeParse(data);

export const validateUpdateProjectData = (data: Partial<ProjectData>) =>
  updateProjectSchema.safeParse(data);

export const validateProjectMemberData = (data: ProjectMemberData) =>
  addProjectMemberSchema.safeParse(data);

export const validateUpdateMemberRoleData = (data: UpdateMemberRoleData) =>
  updateMemberRoleSchema.safeParse(data);

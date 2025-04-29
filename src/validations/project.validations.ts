import { z } from "zod";
import { UserRole } from "../utils/permissions";

const projectSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().nonempty(),
});

const projectMemberSchema = z.object({
  role: z.enum([UserRole.Owner, UserRole.ProjectManager, UserRole.Member]),
  email: z.string().email({ message: "Invalid email address" }),
});
const removeMemberSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

type projectData = z.infer<typeof projectSchema>;
type projectMemberData = z.infer<typeof projectMemberSchema>;
type removeProjectMemberData = z.infer<typeof removeMemberSchema>;

const validateProjectData = (project: projectData) => {
  return projectSchema.safeParse(project);
};
const validateProjectMemberData = (member: projectMemberData) => {
  return projectMemberSchema.safeParse(member);
};
const validateRemoveProjectMemberData = (member: removeProjectMemberData) => {
  return removeMemberSchema.safeParse(member);
};

export {
  validateProjectData,
  validateProjectMemberData,
  validateRemoveProjectMemberData,
};

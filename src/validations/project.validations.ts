import { z } from "zod";

const projectSchema = z.object({
  name: z.string().nonempty(),
  description: z.string().nonempty(),
});

type projectType = z.infer<typeof projectSchema>;

const validateProjectData = (project: projectType) => {
  return projectSchema.safeParse(project);
};

export { validateProjectData };

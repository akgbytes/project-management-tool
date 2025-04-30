import { z } from "zod";
const noteSchema = z.object({
  title: z.string().trim().nonempty("Note title is required"),
  content: z.string().trim().nonempty("Note content is required"),
});

const updateNoteSchema = noteSchema.partial();

export type NoteData = z.infer<typeof noteSchema>;

export const validateNoteData = (data: NoteData) => {
  return noteSchema.safeParse(data);
};

export const validateUpdateNoteData = (data: Partial<NoteData>) => {
  return updateNoteSchema.safeParse(data);
};

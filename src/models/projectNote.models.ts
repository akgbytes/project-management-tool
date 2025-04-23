import { model, Schema } from "mongoose";

export interface IProjectNote extends Document {
  createdBy: Schema.Types.ObjectId;
  project: Schema.Types.ObjectId;
  content: string;
}

const projectNoteSchema = new Schema<IProjectNote>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const ProjectNote = model("ProjectNote", projectNoteSchema);

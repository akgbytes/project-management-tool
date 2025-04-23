import { model, Schema } from "mongoose";

export interface IProject extends Document {
  name: string;
  description: string;
  createdBy: Schema.Types.ObjectId;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Project = model("Project", projectSchema);

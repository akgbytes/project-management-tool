import { model, Schema } from "mongoose";

export interface SubTask extends Document {
  title: string;
  task: Schema.Types.ObjectId;
  isCompleted: boolean;
  createdBy: Schema.Types.ObjectId;
}

const subTaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

subTaskSchema.index({ project: 1, task: 1, title: 1 }, { unique: true });

export const SubTask = model("SubTask", subTaskSchema);

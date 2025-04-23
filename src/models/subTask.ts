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

export const SubTask = model("SubTask", subTaskSchema);

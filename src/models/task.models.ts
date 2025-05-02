import { model, Schema } from "mongoose";
import { ProjectStatus, ProjectStatusType } from "../utils/constants";

export interface Attachment {
  url: string;
  mimetype: string;
  size: number;
}

export interface ITask extends Document {
  title: string;
  description: string;
  project: Schema.Types.ObjectId;
  assignedTo: Schema.Types.ObjectId;
  assignedBy: Schema.Types.ObjectId;
  status: ProjectStatusType;
  attachments: Attachment[];
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.PLANNING,
    },
    attachments: {
      type: [
        {
          url: { type: String },
          mimetype: { type: String },
          size: { type: Number },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

taskSchema.index({ title: 1, project: 1 }, { unique: true });

export const Task = model("Task", taskSchema);

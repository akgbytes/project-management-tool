import { model, Schema } from "mongoose";
import { UserRole, UserRoleType } from "../utils/constants";
export interface IProjectMember extends Document {
  user: Schema.Types.ObjectId;
  project: Schema.Types.ObjectId;
  role: UserRoleType;
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.Member,
    },
  },
  { timestamps: true }
);

export const ProjectMember = model("ProjectMember", projectMemberSchema);

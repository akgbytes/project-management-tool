import { model, Schema } from "mongoose";
import { UserRole, UserRolePermissions } from "../utils/permissions";

export interface IProjectMember extends Document {
  user: Schema.Types.ObjectId;
  project: Schema.Types.ObjectId;
  role: UserRole;
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
      enum: Object.keys(UserRolePermissions),
      default: "member",
    },
  },
  { timestamps: true }
);

export const ProjectMember = model("ProjectMember", projectMemberSchema);

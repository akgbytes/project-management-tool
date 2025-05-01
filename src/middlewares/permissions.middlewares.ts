import { Request, Response, NextFunction } from "express";
import { ProjectMember } from "../models/projectMember.models";
import { CustomError } from "../utils/CustomError";
import {
  hasPermission,
  PermissionDescriptions,
  PermissionType,
} from "../utils/permissions";
import { ResponseStatus, UserRoleType } from "../utils/constants";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose from "mongoose";

export const checkPermission = (permission: PermissionType) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user._id;
      const projectId = req.params.projectId;

      // to avoid error when receiving something like 123 in projectId
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new CustomError(ResponseStatus.BadRequest, "Invalid project ID");
      }

      const membership = await ProjectMember.findOne({
        project: projectId,
        user: userId,
      });

      if (!membership) {
        throw new CustomError(
          ResponseStatus.BadRequest,
          "Project membership not found"
        );
      }

      const userRole = membership.role as UserRoleType;

      if (!hasPermission(userRole, permission)) {
        throw new CustomError(
          ResponseStatus.Forbidden,
          PermissionDescriptions[permission] || "Access denied"
        );
      }

      next();
    }
  );
};

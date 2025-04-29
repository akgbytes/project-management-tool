import { Request, Response, NextFunction } from "express";

import { ProjectMember } from "../models/projectMember";
import { CustomError } from "../utils/CustomError";
import {
  hasPermission,
  PermissionType,
  UserRole,
  UserRoleType,
} from "../utils/permissions";
import { ResponseStatus } from "../utils/constants";

export const checkPermission = (permission: PermissionType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // i need to check project id and find out user role in that
    const userId = req.user._id;
    const projectId = req.params.projectId;

    const project = await ProjectMember.findOne({
      _id: projectId,
      user: userId,
    });

    if (!project) {
      throw new CustomError(ResponseStatus.BadRequest, "Access denied");
    }

    const userRole = project.role as UserRoleType;

    if (!hasPermission(userRole, permission)) {
      throw new CustomError(ResponseStatus.Forbidden, "Access denied");
    }
    next();
  };
};

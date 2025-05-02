import { ProjectMember } from "../models/projectMember.models";
import { CustomError } from "../utils/CustomError";
import {
  hasPermission,
  PermissionDescriptions,
  PermissionType,
} from "../utils/permissions";
import { ResponseStatus, UserRoleType } from "../utils/constants";
import { asyncHandler } from "../utils/asyncHandler";
import { validateObjectId } from "../utils/helper";
import logger from "../utils/logger";

export const checkPermission = (permission: PermissionType) => {
  return asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    const { pid } = req.params;

    validateObjectId(pid, "Project");

    const membership = await ProjectMember.findOne({
      project: pid,
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
  });
};

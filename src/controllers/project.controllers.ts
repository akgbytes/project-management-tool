import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { handleZodError } from "../utils/handleZodError";
import {
  validateProjectData,
  validateProjectMemberData,
  validateUpdateMemberRoleData,
  validateUpdateProjectData,
} from "../validations/project.validations";
import { Project } from "../models/project.models";
import { ProjectMember } from "../models/projectMember.models";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import { ApiResponse } from "../utils/ApiResponse";
import { UserRole } from "../utils/constants";
import { IUser, User } from "../models/user.models";
import { validateObjectId } from "../utils/helper";
import logger from "../utils/logger";

const createProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, description } = handleZodError(validateProjectData(req.body));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [newProject] = await Project.create(
      [{ name, description, createdBy: userId }],
      { session },
    );

    await ProjectMember.create(
      [
        {
          user: newProject.createdBy,
          project: newProject._id,
          role: UserRole.Owner,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    logger.info(
      `Project with name: ${name} created successfully by user ${userId}`,
    );

    res
      .status(ResponseStatus.Success)
      .json(
        new ApiResponse(
          ResponseStatus.Success,
          newProject,
          "Project created successfully",
        ),
      );
  } catch (error: any) {
    await session.abortTransaction();
    if (error.code === 11000) {
      throw new CustomError(
        ResponseStatus.Conflict,
        "Project name must be unique per user",
      );
    }
    throw new CustomError(
      ResponseStatus.InternalServerError,
      `Error while creating project: ${error.message}`,
    );
  } finally {
    session.endSession();
  }
});

const deleteProject = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const userId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deletedProject = await Project.findByIdAndDelete(pid, { session });
    if (!deletedProject) {
      throw new CustomError(ResponseStatus.NotFound, "Project does not exist");
    }

    await ProjectMember.deleteMany({ project: pid }, { session });

    await session.commitTransaction();

    logger.info(
      `Project with ID: ${pid} successfully deleted by user ${userId}`,
    );

    res
      .status(ResponseStatus.Success)
      .json(
        new ApiResponse(
          ResponseStatus.Success,
          null,
          "Project deleted successfully",
        ),
      );
  } catch (error: any) {
    await session.abortTransaction();
    throw new CustomError(
      ResponseStatus.InternalServerError,
      `Error while deleting project: ${error.message}`,
    );
  } finally {
    session.endSession();
  }
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = handleZodError(
    validateUpdateProjectData(req.body),
  );
  const { pid } = req.params;
  const userId = req.user._id;

  const updatePayload: Partial<{ name: string; description: string }> = {};
  if (name !== undefined) updatePayload.name = name;
  if (description !== undefined) updatePayload.description = description;

  if (Object.keys(updatePayload).length === 0) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "At least one field (name or description) is required to update",
    );
  }

  const updatedProject = await Project.findByIdAndUpdate(pid, updatePayload, {
    new: true,
  });

  if (!updatedProject) {
    throw new CustomError(ResponseStatus.NotFound, "Project does not exist");
  }

  logger.info(`Project with ID: ${pid} successfully updated by user ${userId}`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        updatedProject,
        "Project updated successfully",
      ),
    );
});

const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const projects = await ProjectMember.aggregate([
    {
      $match: { user: new mongoose.Types.ObjectId(userId as string) },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "projectData",
      },
    },
    { $unwind: "$projectData" },
    {
      $lookup: {
        from: "users",
        localField: "projectData.createdBy",
        foreignField: "_id",
        as: "createdByUser",
      },
    },
    { $unwind: "$createdByUser" },
    {
      $lookup: {
        from: "projectmembers",
        localField: "project",
        foreignField: "project",
        as: "members",
      },
    },
    {
      $project: {
        _id: 0,
        pid: "$projectData._id",
        name: "$projectData.name",
        description: "$projectData.description",
        createdAt: "$projectData.createdAt",
        createdBy: {
          username: "$createdByUser.username",
          email: "$createdByUser.email",
        },
        role: 1,
        memberCount: { $size: "$members" },
      },
    },
  ]);

  logger.info(`Projects fetched successfully for user ${userId}`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        projects,
        projects.length
          ? "Projects fetched successfully"
          : "No projects available",
      ),
    );
});

const getProjectById = asyncHandler(async (req, res) => {
  const { pid } = req.params;
  const userId = req.user._id;

  const project = await ProjectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId as string),
        project: new mongoose.Types.ObjectId(pid),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "projectData",
      },
    },
    { $unwind: "$projectData" },
    {
      $lookup: {
        from: "users",
        localField: "projectData.createdBy",
        foreignField: "_id",
        as: "createdByUser",
      },
    },
    { $unwind: "$createdByUser" },
    {
      $lookup: {
        from: "projectmembers",
        localField: "project",
        foreignField: "project",
        as: "members",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "members.user",
        foreignField: "_id",
        as: "memberUsers",
      },
    },
    {
      $addFields: {
        members: {
          $map: {
            input: "$members",
            as: "member",
            in: {
              role: "$$member.role",
              userId: "$$member.user",
              userDetails: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$memberUsers",
                      as: "user",
                      cond: { $eq: ["$$user._id", "$$member.user"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        pid: "$projectData._id",
        name: "$projectData.name",
        description: "$projectData.description",
        createdAt: "$projectData.createdAt",
        updatedAt: "$projectData.updatedAt",
        createdBy: {
          username: "$createdByUser.username",
          email: "$createdByUser.email",
          fullName: "$createdByUser.fullName",
          avatar: "$createdByUser.avatar",
        },
        role: 1,
        members: {
          $map: {
            input: "$members",
            as: "member",
            in: {
              userId: "$$member.userId",
              role: "$$member.role",
              username: "$$member.userDetails.username",
              email: "$$member.userDetails.email",
              fullName: "$$member.userDetails.fullName",
              avatar: "$$member.userDetails.avatar",
            },
          },
        },
      },
    },
  ]);

  logger.info(
    `Project with ID: ${pid} successfully fetched for user ${userId}`,
  );

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        project[0],
        "Project fetched successfully",
      ),
    );
});

const addMemberToProject = asyncHandler(async (req, res) => {
  const { role, email } = handleZodError(validateProjectMemberData(req.body));
  const { pid } = req.params;

  const userToAdd = await User.findOne({ email, isEmailVerified: true });
  if (!userToAdd) {
    throw new CustomError(
      ResponseStatus.NotFound,
      "Either user does not exist or not verified yet",
    );
  }

  const isAlreadyMember = await ProjectMember.findOne({
    user: userToAdd._id,
    project: pid,
  });

  if (isAlreadyMember) {
    throw new CustomError(
      ResponseStatus.Conflict,
      "User is already a member of this project",
    );
  }

  const projectMember = await ProjectMember.create({
    role,
    project: pid,
    user: userToAdd._id,
  });

  logger.info(`User ${email} added to project ${pid} successfully`);

  res.status(ResponseStatus.Success).json(
    new ApiResponse(
      ResponseStatus.Success,
      {
        id: projectMember._id,
        userId: userToAdd._id,
        email: userToAdd.email,
        role,
      },
      "Member added successfully",
    ),
  );
});

const removeMember = asyncHandler(async (req, res) => {
  const { mid } = req.params;
  validateObjectId(mid, "Project Member");

  const deletedMember = await ProjectMember.findByIdAndDelete(mid);
  if (!deletedMember) {
    throw new CustomError(ResponseStatus.NotFound, "Project member not found");
  }

  logger.info(`Project member with ID ${mid} removed successfully`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        null,
        "Member removed successfully",
      ),
    );
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  const members = await ProjectMember.find({ project: pid })
    .populate({ path: "user", select: "username email fullName avatar" })
    .select("role user");

  const formattedMembers = members.map((member) => {
    const user = member.user as unknown as IUser;
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: member.role,
    };
  });

  logger.info(`Members fetched successfully for project ${pid}`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        formattedMembers,
        "Project members fetched successfully",
      ),
    );
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = handleZodError(validateUpdateMemberRoleData(req.body));
  const { mid, pid } = req.params;

  validateObjectId(mid, "Project Member");

  const projectMember = await ProjectMember.findById(mid);

  if (!projectMember) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Project member not found",
    );
  }

  if (projectMember.role === role) {
    return res
      .status(ResponseStatus.Success)
      .json(
        new ApiResponse(
          ResponseStatus.Success,
          null,
          "Role is already up to date",
        ),
      );
  }

  projectMember.role = role;
  await projectMember.save();

  logger.info(`Role for member ${mid} in project ${pid} updated to ${role}`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        null,
        "Role updated successfully",
      ),
    );
});

export {
  createProject,
  deleteProject,
  updateProject,
  getProjects,
  getProjectById,
  addMemberToProject,
  removeMember,
  getProjectMembers,
  updateMemberRole,
};

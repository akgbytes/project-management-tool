import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { handleZodError } from "../utils/handleZodError";
import {
  validateProjectData,
  validateProjectMemberData,
  validateRemoveProjectMemberData,
  validateUpdateProjectData,
} from "../validations/project.validations";
import { Project } from "../models/project.models";
import { ProjectMember } from "../models/projectMember.models";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import { ApiResponse } from "../utils/ApiResponse";
import { UserRole } from "../utils/constants";
import { IUser, User } from "../models/user.models";

const createProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, description } = handleZodError(validateProjectData(req.body));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [newProject] = await Project.create(
      [{ name, description, createdBy: userId }],
      { session }
    );

    await ProjectMember.create(
      [
        {
          user: userId,
          project: newProject._id,
          role: UserRole.Owner,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res
      .status(ResponseStatus.Success)
      .json(
        new ApiResponse(
          ResponseStatus.Success,
          newProject,
          "Project created successfully"
        )
      );
  } catch (error: any) {
    await session.abortTransaction();
    if (error.code === 11000) {
      throw new CustomError(
        ResponseStatus.Conflict,
        "Project name must be unique per user"
      );
    }
    throw new CustomError(
      ResponseStatus.InternalServerError,
      `Error while creating project: ${error.message}`
    );
  } finally {
    session.endSession();
  }
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // if control is reaching here, project exists for sure and also user is owner
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Project.findByIdAndDelete(projectId, { session });
    await ProjectMember.deleteMany({ project: projectId }, { session });

    await session.commitTransaction();

    res
      .status(ResponseStatus.Success)
      .json(
        new ApiResponse(
          ResponseStatus.Success,
          {},
          "Project deleted successfully"
        )
      );
  } catch (error: any) {
    await session.abortTransaction();
    throw new CustomError(
      ResponseStatus.InternalServerError,
      `Error while deleting project: ${error.message}`
    );
  } finally {
    session.endSession();
  }
});

const updateProject = asyncHandler(async (req, res) => {
  // need to rethink that if user gives only one field to upload then what
  const { name, description } = handleZodError(
    validateUpdateProjectData(req.body)
  );
  const { projectId } = req.params;

  // ensuring partial updates
  const updatePayload: Partial<{ name: string; description: string }> = {};
  if (name !== undefined) updatePayload.name = name;
  if (description !== undefined) updatePayload.description = description;

  if (Object.keys(updatePayload).length === 0) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "At least one field (name or description) is required to update"
    );
  }

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    updatePayload,
    {
      new: true,
    }
  );

  if (!updatedProject) {
    throw new CustomError(
      ResponseStatus.NotFound,
      "Project could not be updated"
    );
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        updatedProject,
        "Project updated successfully"
      )
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
        projectId: "$projectData._id",
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

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        projects,
        projects.length
          ? "Projects fetched successfully"
          : "No projects available"
      )
    );
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  const project = await ProjectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId as string),
        project: new mongoose.Types.ObjectId(projectId),
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
        projectId: "$projectData._id",
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

  // this will never happen bcuz middleware have already check membership
  // if (!project.length) {
  //   throw new CustomError(ResponseStatus.NotFound, "Project not found");
  // }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        project[0],
        "Project fetched successfully"
      )
    );
});

const addMemberToProject = asyncHandler(async (req, res) => {
  const { role, email } = handleZodError(validateProjectMemberData(req.body));
  const { projectId } = req.params;

  const userToAdd = await User.findOne({ email });
  if (!userToAdd) {
    throw new CustomError(ResponseStatus.NotFound, "User does not exist");
  }

  const isAlreadyMember = await ProjectMember.findOne({
    user: userToAdd._id,
    project: projectId,
  });

  if (isAlreadyMember) {
    throw new CustomError(
      ResponseStatus.Conflict,
      "User is already a member of this project"
    );
  }

  // to make sure there can be only one project manager
  // const projectManagerExists = await ProjectMember.findOne({
  //   project: projectId,
  //   role: UserRole.ProjectManager,
  // });

  // if (projectManagerExists) {
  //   throw new CustomError(
  //     400,
  //     "Only one Project Manager is allowed per project."
  //   );
  // }

  const projectMember = await ProjectMember.create({
    role,
    project: projectId,
    user: userToAdd._id,
  });

  res.status(ResponseStatus.Success).json(
    new ApiResponse(
      ResponseStatus.Success,
      {
        id: projectMember._id,
        userId: userToAdd._id,
        email: userToAdd.email,
        role,
      },
      "Member added successfully"
    )
  );
});

const removeMember = asyncHandler(async (req, res) => {
  const { email } = handleZodError(validateRemoveProjectMemberData(req.body));
  const { projectId } = req.params;

  const userToRemove = await User.findOne({ email });
  if (!userToRemove) {
    throw new CustomError(ResponseStatus.NotFound, "User does not exist");
  }

  const projectMember = await ProjectMember.findOne({
    project: projectId,
    user: userToRemove._id,
  });

  if (!projectMember) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "User is not a member of this project"
    );
  }

  await ProjectMember.findByIdAndDelete(projectMember._id);

  res.status(ResponseStatus.Success).json(
    new ApiResponse(
      ResponseStatus.Success,
      {
        userId: userToRemove._id,
        email: userToRemove.email,
      },
      "Member removed successfully"
    )
  );
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // control reached here means project exists for sure
  const members = await ProjectMember.find({ project: projectId })
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

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        formattedMembers,
        "Project members fetched successfully"
      )
    );
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { email, role } = handleZodError(validateProjectMemberData(req.body));
  const { projectId } = req.params;

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError(ResponseStatus.BadRequest, "User does not exist");
  }

  const projectMember = await ProjectMember.findOne({
    project: projectId,
    user: user._id,
  });

  if (!projectMember) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "User is not a member of this project"
    );
  }

  // if member role is already eq to role
  if (projectMember.role === role) {
    return res
      .status(ResponseStatus.Success)
      .json(
        new ApiResponse(
          ResponseStatus.Success,
          {},
          "Role is already up to date"
        )
      );
  }

  projectMember.role = role;
  await projectMember.save();

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(ResponseStatus.Success, {}, "Role updated successfully")
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

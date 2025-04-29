import mongoose, { ObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { handleZodError } from "../utils/handleZodError";
import {
  validateProjectData,
  validateProjectMemberData,
  validateRemoveProjectMemberData,
} from "../validations/project.validations";
import { Project } from "../models/project.models";
import { ProjectMember } from "../models/projectMember";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import { ApiResponse } from "../utils/ApiResponse";
import { UserRole } from "../utils/permissions";
import { extractUserField } from "../utils/helper";
import { User } from "../models/user.models";

const createProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, description } = handleZodError(validateProjectData(req.body));
  const session = await mongoose.startSession();
  session.startTransaction();
  let project;
  try {
    project = await Project.create(
      [
        {
          name,
          description,
          createdBy: userId,
        },
      ],
      { session }
    );

    await ProjectMember.create(
      [
        {
          user: userId,
          project: project[0]._id,
          role: UserRole.Owner,
        },
      ],
      { session }
    );

    await session.commitTransaction();
  } catch (error: any) {
    await session.abortTransaction();

    throw new CustomError(
      ResponseStatus.InternalServerError,
      `Error while creating project : ${error.messaeg}`
    );
  } finally {
    session.endSession();
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        project[0],
        "Project created successfully"
      )
    );
});

const deleteProject = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Project.findByIdAndDelete([{ userId }], { session });
    await ProjectMember.deleteMany([{ project: projectId }], { session });
    session.commitTransaction();
  } catch (error: any) {
    session.abortTransaction();
    throw new CustomError(
      ResponseStatus.InternalServerError,
      `Error while delete project : ${error.message}`
    );
  } finally {
    session.endSession();
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        {},
        "Project deleted successfully"
      )
    );
});

const updateProject = asyncHandler(async (req, res) => {
  // need to rethink that if user gives only one field to upload then what
  const { name, description } = handleZodError(validateProjectData(req.body));
  const { projectId } = req.params;
  const updated = await Project.findByIdAndUpdate(
    projectId,
    {
      name,
      description,
    },
    { returnDocument: "after" }
  );

  if (!updated) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Some error occured while updating project"
    );
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        updated,
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

  if (!projects.length) {
    throw new CustomError(
      ResponseStatus.InternalServerError,
      "Failed to fetch projects"
    );
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        projects,
        "Projects fetched successfully"
      )
    );
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user._id;

  const project = await ProjectMember.aggregate([
    {
      $match: {
        $and: [
          { user: new mongoose.Types.ObjectId(userId as string) },
          { project: new mongoose.Types.ObjectId(projectId) },
        ],
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
              // double dollar bcuz single dollar will search for member is toplev doc
              //  but we can it to search it in this scope
              role: "$$member.role",
              username: extractUserField("username"),
              email: extractUserField("email"),
              fullName: extractUserField("fullName"),
              avatar: extractUserField("avatar"),
            },
          },
        },
      },
    },
  ]);

  if (!project.length) {
    throw new CustomError(
      ResponseStatus.InternalServerError,
      "Failed to fetch project"
    );
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        project,
        "Projects fetched successfully"
      )
    );
});

const addMemberToProject = asyncHandler(async (req, res) => {
  const { role, email } = handleZodError(validateProjectMemberData(req.body));
  const userId = req.user._id;
  const { projectId } = req.params;

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError(ResponseStatus.BadRequest, "User does not exist");
  }

  const existing = await ProjectMember.findOne({
    user: userId,
    project: projectId,
  });

  if (existing) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "User is already a member in this project"
    );
  }

  const projectManagerExists = await ProjectMember.findOne({
    user: userId,
    project: projectId,
    role: UserRole.ProjectManager,
  });

  if (projectManagerExists) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "There can't be more than one project manager in a project"
    );
  }

  const projectMember = await ProjectMember.create({
    role,
    project: projectId,
    user: user._id,
  });

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        projectMember,
        "Member added successfully"
      )
    );
});

const removeMember = asyncHandler(async (req, res) => {
  const { email } = handleZodError(validateRemoveProjectMemberData(req.body));
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
      "User is not member of this project"
    );
  }

  await ProjectMember.findByIdAndDelete(projectMember._id);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(ResponseStatus.Success, {}, "Member removed successfully")
    );
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const projectExists = await Project.findById(projectId);

  if (!projectExists) {
    throw new CustomError(ResponseStatus.BadRequest, "Project does not exists");
  }

  const projectMembers = await ProjectMember.find({
    project: projectId,
  }).populate("user", "username email fullName avatar");

  const cleanData = projectMembers.map((member) => member.user);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        cleanData,
        "project memebers fetched successfully"
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
      "User is not member of this project"
    );
  }

  const projectManagerExists = await ProjectMember.findOne({
    user: user._id,
    project: projectId,
    role: UserRole.ProjectManager,
  });

  if (projectManagerExists && role === UserRole.ProjectManager) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "There can't be more than one project manager in a project"
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

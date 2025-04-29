import mongoose, { ObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { handleZodError } from "../utils/handleZodError";
import { validateProjectData } from "../validations/project.validations";
import { Project } from "../models/project.models";
import { ProjectMember } from "../models/projectMember";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import { ApiResponse } from "../utils/ApiResponse";
import { UserRole } from "../utils/permissions";

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
          _id: "$createdByUser._id",
          username: "$createdByUser.username",
          email: "$createdByUser.email",
        },
        role: 1,
        memberCount: { $size: "$members" },
      },
    },
  ]);

  if (!projects) {
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
  // get project by id
});

const addMemberToProject = asyncHandler(async (req, res) => {
  // add member to project
});

const removeMember = asyncHandler(async (req, res) => {
  // delete member from project
});

const getProjectMembers = asyncHandler(async (req, res) => {
  // get project members
});

const updateMemberRole = asyncHandler(async (req, res) => {
  // update member role
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

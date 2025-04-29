import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { handleZodError } from "../utils/handleZodError";
import { validateProjectData } from "../validations/project.validations";
import { Project } from "../models/project.models";
import { ProjectMember } from "../models/projectMember";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import { ApiResponse } from "../utils/ApiResponse";

const createProject = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { name, description } = handleZodError(validateProjectData(req.body));
  const session = await mongoose.startSession();
  session.startTransaction();

  let project;

  try {
    project = await Project.create({
      name,
      description,
      createdBy: _id,
    });

    await ProjectMember.create({
      user: _id,
      project: project._id,
      role: "owner",
    });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw new CustomError(
      ResponseStatus.InternalServerError,
      "Some error occured while creating project"
    );
  } finally {
    session.endSession();
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        project,
        "Project created successfully"
      )
    );
});

const updateProject = asyncHandler(async (req, res) => {
  // update project
});

const deleteProject = asyncHandler(async (req, res) => {
  // delete project
});
const getProjects = asyncHandler(async (req, res) => {
  // need to add pagination (?page=1&limit=10)
  // and filters (?search=name) later
  const userId = req.user._id;
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

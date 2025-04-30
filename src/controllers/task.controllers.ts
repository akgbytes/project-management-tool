import { Multer } from "multer";
import { ProjectMember } from "../models/projectMember";
import { Task } from "../models/task.models";
import { User } from "../models/user.models";
import { asyncHandler } from "../utils/asyncHandler";
import { ResponseStatus } from "../utils/constants";
import { CustomError } from "../utils/CustomError";
import { handleZodError } from "../utils/handleZodError";
import { validateTaskData } from "../validations/tast.validations";
import { uploadOnCloudinary } from "../configs/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";

// create task
const createTask = asyncHandler(async (req, res) => {
  const { title, description, email, status } = handleZodError(
    validateTaskData(req.body)
  );
  const { projectId } = req.params;
  const userId = req.user._id;

  const assignedToUser = await User.findOne({ email });
  if (!assignedToUser) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "User with the given email does not exist"
    );
  }

  const membership = await ProjectMember.findOne({
    project: projectId,
    user: assignedToUser._id,
  });

  if (!membership) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Project membership not found with the given email"
    );
  }

  const task = await Task.create({
    title,
    description,
    assignedBy: userId,
    assignedTo: assignedToUser._id,
    project: projectId,
    status,
  });

  if (!task) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "error while creating task"
    );
  }

  const attachments = await Promise.all(
    (req.files as Express.Multer.File[]).map(async (file) => {
      const result = await uploadOnCloudinary(file.path);
      return {
        url: result?.secure_url,
        mimetype: file.mimetype,
        size: file.size,
      };
    })
  );

  console.log("attachments : ", attachments);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(ResponseStatus.Success, task, "Task created successfully")
    );
});

// update task
const updateTask = asyncHandler(async (req, res) => {
  // update task
});

// delete task
const deleteTask = asyncHandler(async (req, res) => {
  // delete task
});
const getTasks = asyncHandler(async (req, res) => {
  // get all tasks
});

// get task by id
const getTaskById = asyncHandler(async (req, res) => {
  // get task by id
});

// create subtask
const createSubTask = asyncHandler(async (req, res) => {
  // create subtask
});

// update subtask
const updateSubTask = asyncHandler(async (req, res) => {
  // update subtask
});

// delete subtask
const deleteSubTask = asyncHandler(async (req, res) => {
  // delete subtask
});

export {
  createTask,
  deleteTask,
  updateTask,
  getTasks,
  getTaskById,
  createSubTask,
  deleteSubTask,
  updateSubTask,
};

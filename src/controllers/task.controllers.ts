import { ProjectMember } from "../models/projectMember.models";
import { Attachment, Task } from "../models/task.models";
import { User } from "../models/user.models";
import { asyncHandler } from "../utils/asyncHandler";
import { ResponseStatus } from "../utils/constants";
import { CustomError } from "../utils/CustomError";
import { handleZodError } from "../utils/handleZodError";
import {
  validateSubTaskData,
  validateTaskData,
  validateUpdateSubTaskData,
  validateUpdateTaskData,
} from "../validations/task.validations";
import { uploadOnCloudinary } from "../configs/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import mongoose from "mongoose";
import { SubTask } from "../models/subTask.models";
import { partialUtil } from "zod/lib/helpers/partialUtil";

// unique check fix
const createTask = asyncHandler(async (req, res) => {
  const { title, description, email } = handleZodError(
    validateTaskData(req.body)
  );

  const { projectId } = req.params;
  const userId = req.user._id;

  const existing = await Task.findOne({ title });
  if (existing) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Task with same title already exists"
    );
  }

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

  console.log("Attachments: ", attachments);

  task.attachments = attachments as Attachment[];
  await task.save();

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(ResponseStatus.Success, task, "Task created successfully")
    );
});

// update task
const updateTask = asyncHandler(async (req, res) => {
  const { title, description, email, status } = handleZodError(
    validateUpdateTaskData(req.body)
  );
  const { projectId, taskId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new CustomError(ResponseStatus.BadRequest, "Invalid task ID");
  }

  const existing = await Task.findOne({ title });
  if (!existing) {
    throw new CustomError(ResponseStatus.BadRequest, "Task does not exist");
  }

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

  const updatePayload: Partial<{
    title: string;
    description: string;
    assignedTo: string;
    status: string;
  }> = {};
  if (title !== undefined) updatePayload.title = title;
  if (description !== undefined) updatePayload.description = description;
  if (email !== undefined)
    updatePayload.assignedTo = assignedToUser._id as string;
  if (status !== undefined) updatePayload.status = status;

  if (Object.keys(updatePayload).length === 0) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "At least one field is required to update"
    );
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, updatePayload, {
    new: true,
  });

  if (!updatedTask) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Error while updating task"
    );
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        updatedTask,
        "Task created successfully"
      )
    );
});

// delete task
const deleteTask = asyncHandler(async (req, res) => {
  // const { taskId } = req.params;
  // if (!mongoose.Types.ObjectId.isValid(taskId)) {
  //   throw new CustomError(ResponseStatus.BadRequest, "Invalid task ID");
  // }
  // const existing = await Task.findOne({ title });
  // if (!existing) {
  //   throw new CustomError(ResponseStatus.BadRequest, "Task does not exist");
  // }
});
const getTasks = asyncHandler(async (req, res) => {
  // get all tasks
});

// get task by id
const getTaskById = asyncHandler(async (req, res) => {
  // get task by id
});

const createSubTask = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.params;
  const { title } = handleZodError(validateSubTaskData(req.body));
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new CustomError(ResponseStatus.BadRequest, "Invalid task ID");
  }

  const taskExists = await Task.findById(taskId);

  if (!taskExists) {
    throw new CustomError(ResponseStatus.BadRequest, "Task does not exist");
  }

  const subTaskExists = await SubTask.findOne({
    title,
    project: projectId,
    task: taskId,
  });

  if (subTaskExists) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Subtask with same title already exists"
    );
  }

  const subTask = await SubTask.create({
    title,
    project: projectId,
    task: taskId,
    createdBy: userId,
  });

  if (!subTask) {
    throw new CustomError(
      ResponseStatus.InternalServerError,
      "Error while creating sub task"
    );
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        subTask,
        "Subtask created successfully"
      )
    );
});

// update subtask
const updateSubTask = asyncHandler(async (req, res) => {
  const { title, isCompleted } = handleZodError(
    validateUpdateSubTaskData(req.body)
  );
  const { subTaskId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(subTaskId)) {
    throw new CustomError(ResponseStatus.BadRequest, "Invalid task ID");
  }

  const updatePayload: Partial<{ title: string; isCompleted: boolean }> = {};
  if (title !== undefined) updatePayload.title = title;
  if (isCompleted !== undefined) updatePayload.isCompleted = isCompleted;

  if (Object.keys(updatePayload).length === 0) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "At least one field is required to update"
    );
  }

  const updatedData = await SubTask.findByIdAndUpdate(
    subTaskId,
    updatePayload,
    {
      new: true,
    }
  ).select("title isCompleted updatedAt");

  if (!updatedData) {
    throw new CustomError(
      ResponseStatus.InternalServerError,
      "Sub task not found or failed to update"
    );
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        updatedData,
        "Subtask updated successfully"
      )
    );
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

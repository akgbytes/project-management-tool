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
import logger from "../utils/logger";
import { validateObjectId } from "../utils/helper";

const createTask = asyncHandler(async (req, res) => {
  const { title, description, email } = handleZodError(
    validateTaskData(req.body)
  );

  const { pid } = req.params;
  const userId = req.user._id;

  const assignedToUser = await User.findOne({ email });
  if (!assignedToUser) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "User with the given email does not exist"
    );
  }

  const membership = await ProjectMember.findOne({
    project: pid,
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
    project: pid,
  });

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

  task.attachments = attachments as Attachment[];
  await task.save();

  logger.info(`Task "${title}" created in project ${pid} by user ${userId}`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(ResponseStatus.Success, task, "Task created successfully")
    );
});

const updateTask = asyncHandler(async (req, res) => {
  const { title, description, email, status } = handleZodError(
    validateUpdateTaskData(req.body)
  );
  const { pid, tid } = req.params;

  validateObjectId(tid, "Task");
  validateObjectId(pid, "Project");

  const updatePayload: Partial<{
    title: string;
    description: string;
    assignedTo: string;
    status: string;
  }> = {};
  if (title !== undefined) updatePayload.title = title;
  if (description !== undefined) updatePayload.description = description;
  if (email !== undefined) {
    const assignedToUser = await User.findOne({ email });
    if (!assignedToUser) {
      throw new CustomError(
        ResponseStatus.BadRequest,
        "User with the given email does not exist"
      );
    }

    const membership = await ProjectMember.findOne({
      project: pid,
      user: assignedToUser._id,
    });

    if (!membership) {
      throw new CustomError(
        ResponseStatus.BadRequest,
        "Project membership not found with the given email"
      );
    }

    updatePayload.assignedTo = assignedToUser._id as string;
  }

  if (status !== undefined) updatePayload.status = status;

  if (Object.keys(updatePayload).length === 0) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "At least one field is required to update"
    );
  }

  const updatedTask = await Task.findByIdAndUpdate(tid, updatePayload, {
    new: true,
  });

  if (!updatedTask) {
    throw new CustomError(ResponseStatus.BadRequest, "Task does not exist");
  }

  logger.info(`Task ${tid} updated by user ${req.user._id}`);

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

const deleteTask = asyncHandler(async (req, res) => {
  const { tid } = req.params;

  validateObjectId(tid, "Task");

  const existing = await Task.findById(tid);
  if (!existing) {
    throw new CustomError(ResponseStatus.BadRequest, "Task does not exist");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await SubTask.deleteMany({ task: tid });
    await Task.findByIdAndDelete(tid);

    session.commitTransaction();

    logger.info(`Task ${tid} and associated subtasks deleted`);

    res
      .status(ResponseStatus.Success)
      .json(
        new ApiResponse(
          ResponseStatus.Success,
          null,
          "Task deleted successfully"
        )
      );
  } catch (error: any) {
    session.abortTransaction();
    throw new CustomError(
      ResponseStatus.InternalServerError,
      `Error while deleting task: ${error.message}`
    );
  } finally {
    session.endSession();
  }
});

const getTasks = asyncHandler(async (req, res) => {
  const { pid } = req.params;

  const tasks = await Task.find({ project: pid })
    .populate({
      path: "assignedTo",
      select: "-_id fullName avatar",
    })
    .populate({
      path: "assignedBy",
      select: "-_id fullName avatar",
    })
    .select(
      "title description assignedTo assignedBy status attachments updatedAt"
    );

  logger.info(
    `User ${req.user._id} fetched ${tasks.length} tasks from project ${pid}`
  );

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        tasks,
        tasks.length ? "Tasks fetched successfully" : "No tasks available"
      )
    );
});

const getTaskById = asyncHandler(async (req, res) => {
  const { tid } = req.params;
  validateObjectId(tid, "Task");

  const task = await Task.findById(tid)
    .populate({
      path: "assignedTo",
      select: "-_id fullName avatar",
    })
    .populate({
      path: "assignedBy",
      select: "-_id fullName avatar",
    })
    .select(
      "title description assignedTo assignedBy status attachments updatedAt"
    );

  if (!task) {
    throw new CustomError(ResponseStatus.BadRequest, "Task does not exist");
  }

  logger.info(`User ${req.user._id} fetched task ${tid}`);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(ResponseStatus.Success, task, "Task fetched successfully")
    );
});

const createSubTask = asyncHandler(async (req, res) => {
  const { tid, pid } = req.params;
  const { title } = handleZodError(validateSubTaskData(req.body));
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(tid)) {
    throw new CustomError(ResponseStatus.BadRequest, "Invalid task ID");
  }

  const taskExists = await Task.findById(tid);

  if (!taskExists) {
    throw new CustomError(ResponseStatus.BadRequest, "Task does not exist");
  }

  const subTaskExists = await SubTask.findOne({
    title,
    project: pid,
    task: tid,
  });

  if (subTaskExists) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Subtask with same title already exists"
    );
  }

  const subTask = await SubTask.create({
    title,
    project: pid,
    task: tid,
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
  const { subtid } = req.params;
  if (!mongoose.Types.ObjectId.isValid(subtid)) {
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

  const updatedData = await SubTask.findByIdAndUpdate(subtid, updatePayload, {
    new: true,
  }).select("title isCompleted updatedAt");

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

const deleteSubTask = asyncHandler(async (req, res) => {
  const { subtid } = req.params;
  if (!mongoose.Types.ObjectId.isValid(subtid)) {
    throw new CustomError(ResponseStatus.BadRequest, "Invalid task ID");
  }

  const deletedSubTask = await SubTask.findByIdAndDelete(subtid);

  if (!deletedSubTask) {
    throw new CustomError(ResponseStatus.NotFound, "Subtask not found");
  }

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        null,
        "Subtask deleted successfully"
      )
    );
});

const addAttachments = asyncHandler(async (req, res) => {
  const { tid } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tid)) {
    throw new CustomError(ResponseStatus.BadRequest, "Invalid task ID");
  }

  const task = await Task.findById(tid);

  if (!task) {
    throw new CustomError(ResponseStatus.BadRequest, "Task does not exists");
  }

  if (task.attachments.length + (req.files?.length as number) > 5) {
    throw new CustomError(ResponseStatus.BadRequest, "Max limit reached");
  }

  const newAttachments = await Promise.all(
    (req.files as Express.Multer.File[]).map(async (file) => {
      const result = await uploadOnCloudinary(file.path);
      return {
        url: result?.secure_url,
        mimetype: file.mimetype,
        size: file.size,
      };
    })
  );

  task.attachments.push(...(newAttachments as Attachment[]));
  await task.save();

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        task.attachments,
        "Attachments updated successfully"
      )
    );
});
const removeAttachments = asyncHandler(async (req, res) => {
  // const { tid, attachmentId } = req.params;
  // if (!mongoose.Types.ObjectId.isValid(tid)) {
  //   throw new CustomError(ResponseStatus.BadRequest, "Invalid task ID");
  // }
  // const task = await Task.findById(tid);
  // if (!task) {
  //   throw new CustomError(ResponseStatus.BadRequest, "Task does not exists");
  // }
  // const something = task.attachments.find((a) => a._id === attachmentId);
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
  addAttachments,
  removeAttachments,
};

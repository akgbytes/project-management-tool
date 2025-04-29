import { asyncHandler } from "../utils/asyncHandler";

// create task
const createTask = asyncHandler(async (req, res) => {
  // create task
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

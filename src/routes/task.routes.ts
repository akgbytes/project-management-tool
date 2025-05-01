import { Router } from "express";
const router = Router();

import {
  createTask,
  deleteTask,
  updateTask,
  createSubTask,
  deleteSubTask,
  updateSubTask,
  getTasks,
  getTaskById,
  addAttachments,
  removeAttachments,
} from "../controllers/task.controllers";
import { isLoggedIn } from "../middlewares/auth.middlewares";
import { checkPermission } from "../middlewares/permissions.middlewares";
import { Permissions } from "../utils/permissions";
import { uploadAttachments } from "../middlewares/multer.middlewares";

router.use(isLoggedIn);

router.post(
  "/create/project/:projectId",
  checkPermission(Permissions.CreateTask),
  uploadAttachments,
  createTask
);
router.delete(
  "/delete/:taskId/project/:projectId",
  checkPermission(Permissions.DeleteTask),
  deleteTask
);
router.patch(
  "/update/:taskId/project/:projectId",
  checkPermission(Permissions.UpdateTask),
  updateTask
);

router.get(
  "/getAll/project/:projectId",
  checkPermission(Permissions.ViewTask),
  getTasks
);

router.get(
  "/get/:taskId/project/:projectId",
  checkPermission(Permissions.ViewTask),
  getTaskById
);

router.post(
  "/subtask/create/task/:taskId/project/:projectId",
  checkPermission(Permissions.CreateSubtask),
  createSubTask
);

router.delete(
  "/subtask/delete/:subTaskId/project/:projectId",
  checkPermission(Permissions.DeleteSubtask),
  deleteSubTask
);

router.patch(
  "/subtask/update/:subTaskId/project/:projectId",
  checkPermission(Permissions.UpdateSubtask),
  updateSubTask
);

router.post(
  "/:taskId/project/:projectId/add/attachments",
  uploadAttachments,
  addAttachments
);
router.delete(
  "/:taskId/project/:projectId/remove/attachments/:attachmentId",
  uploadAttachments,
  removeAttachments
);

export default router;

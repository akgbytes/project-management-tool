import { Router } from "express";
const router = Router();
import {
  createProject,
  deleteProject,
  updateProject,
  getProjects,
  getProjectById,
  addMemberToProject,
  removeMember,
  getProjectMembers,
  updateMemberRole,
} from "../controllers/project.controllers";
import {
  createNote,
  deleteNote,
  updateNote,
  getNotes,
  getNoteById,
} from "../controllers/note.controllers";

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
import { checkPermission } from "../middlewares/permissions.middlewares";
import { Permissions } from "../utils/permissions";
import { uploadAttachments } from "../middlewares/multer.middlewares";
import { isLoggedIn } from "../middlewares/auth.middlewares";

router.use(isLoggedIn);

// Project routes
router.post("/create", createProject);
router.get("/", getProjects);
router.get("/:pid", checkPermission(Permissions.ViewProject), getProjectById);
router.patch(
  "/:pid/update",
  checkPermission(Permissions.UpdateProject),
  updateProject
);
router.delete(
  "/:pid/delete",
  checkPermission(Permissions.DeleteProject),
  deleteProject
);

// Project Members
router.get(
  "/:pid/members",
  checkPermission(Permissions.ViewMembers),
  getProjectMembers
);
router.post(
  "/:pid/members/add",
  checkPermission(Permissions.AddMember),
  addMemberToProject
);
router.delete(
  "/:pid/members/:mid/remove",
  checkPermission(Permissions.RemoveMember),
  removeMember
);
router.patch(
  "/:pid/members/:mid/update-role",
  checkPermission(Permissions.UpdateRole),
  updateMemberRole
);

// Note Routes
router.post(
  "/:pid/notes/create",
  checkPermission(Permissions.CreateNote),
  createNote
);
router.get("/:pid/notes", checkPermission(Permissions.ViewNote), getNotes);
router.get(
  "/:pid/notes/:nid",
  checkPermission(Permissions.ViewNote),
  getNoteById
);
router.patch(
  "/:pid/notes/:nid/update",
  checkPermission(Permissions.UpdateNote),
  updateNote
);
router.delete(
  "/:pid/notes/:nid/delete",
  checkPermission(Permissions.DeleteNote),
  deleteNote
);

// Task Routes
router.post(
  "/:pid/tasks/create",
  checkPermission(Permissions.CreateTask),
  uploadAttachments,
  createTask
);
router.get("/:pid/tasks", checkPermission(Permissions.ViewTask), getTasks);
router.get(
  "/:pid/tasks/:tid",
  checkPermission(Permissions.ViewTask),
  getTaskById
);
router.patch(
  "/:pid/tasks/:tid/update",
  checkPermission(Permissions.UpdateTask),
  updateTask
);
router.delete(
  "/:pid/tasks/:tid/delete",
  checkPermission(Permissions.DeleteTask),
  deleteTask
);

// Subtask Routes
router.post(
  "/:pid/tasks/:tid/subtasks",
  checkPermission(Permissions.CreateSubtask),
  createSubTask
);
router.patch(
  "/:pid/tasks/:tid/subtasks/:sid/update",
  checkPermission(Permissions.UpdateSubtask),
  updateSubTask
);
router.delete(
  "/:pid/tasks/:tid/subtasks/:sid/delete",
  checkPermission(Permissions.DeleteSubtask),
  deleteSubTask
);

// Attachments
router.post(
  "/:pid/tasks/:tid/attachments/add",
  uploadAttachments,
  addAttachments
);
router.delete(
  "/:pid/tasks/:tid/attachments/:attachmentId/remove",
  uploadAttachments,
  removeAttachments
);

export default router;

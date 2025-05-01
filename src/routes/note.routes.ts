import { Router } from "express";
const router = Router();

import { isLoggedIn } from "../middlewares/auth.middlewares";
import {
  createNote,
  deleteNote,
  updateNote,
  getNotes,
  getNoteById,
} from "../controllers/note.controllers";
import { checkPermission } from "../middlewares/permissions.middlewares";
import { Permissions } from "../utils/permissions";

router.use(isLoggedIn);
router.post(
  "/create/project/:projectId",
  checkPermission(Permissions.CreateNote),
  createNote
);
router.delete(
  "/delete/:noteId/project/:projectId",
  checkPermission(Permissions.DeleteNote),
  deleteNote
);
router.patch(
  "/update/:noteId/project/:projectId",
  checkPermission(Permissions.UpdateNote),
  updateNote
);
router.get(
  "/getAll/project/:projectId",
  checkPermission(Permissions.ViewNote),
  getNotes
);
router.get(
  "/get/:noteId/project/:projectId",
  checkPermission(Permissions.ViewNote),
  getNoteById
);

export default router;

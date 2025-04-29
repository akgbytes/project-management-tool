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
} from "../controllers/task.controllers";
import { isLoggedIn } from "../middlewares/auth.middlewares";
import { checkPermission } from "../middlewares/permissions.middlewares";
import { Permissions } from "../utils/permissions";

router.use(isLoggedIn);

router.use(isLoggedIn);
router.post("/create", createTask);
router.delete("/delete", deleteTask);
router.patch("/update", updateTask);
router.get("/getAll", getTasks);
router.get("/get/projectId", getTaskById);
router.post("/subtask/create", createSubTask);
router.delete("/subtask/delete", deleteSubTask);
router.patch("/subtask/update", updateSubTask);

export default router;

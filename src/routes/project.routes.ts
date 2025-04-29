import { Router } from "express";
const router = Router();

import { isLoggedIn } from "../middlewares/auth.middlewares";
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
import { checkPermission } from "../middlewares/permissions.middlewares";
import { Permissions } from "../utils/permissions";

router.use(isLoggedIn);
router.post("/create", createProject);
router.delete(
  "/delete/:projectId",
  checkPermission(Permissions.DeleteProject),
  deleteProject
);
router.patch(
  "/update/:projectId",
  checkPermission(Permissions.UpdateProject),
  updateProject
);
router.get("/getAll", getProjects);
router.get("/get/:projectId", getProjectById);
router.post(
  "/add-member/:projectId",
  checkPermission(Permissions.AddMember),
  addMemberToProject
);
router.delete(
  "delete-member/:projectId",
  checkPermission(Permissions.RemoveMember),
  removeMember
);
router.get("/get/members/:projectId", getProjectMembers);
router.patch(
  "/update/member-role/:projectId",
  checkPermission(Permissions.UpdateRole),
  updateMemberRole
);

export default router;

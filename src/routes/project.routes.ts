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

router.use(isLoggedIn);
router.post("/create", createProject);
router.delete("/delete", deleteProject);
router.patch("/update", updateProject);
router.get("/getAll", getProjects);
router.get("/get/projectId", getProjectById);
router.post("/add-member", addMemberToProject);
router.delete("delete-member", removeMember);
router.get("/get/members", getProjectMembers);
router.patch("/update/member-role", updateMemberRole);

export default router;

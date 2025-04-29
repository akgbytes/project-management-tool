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

router.use(isLoggedIn);
router.post("/create", createNote);
router.delete("/delete", deleteNote);
router.patch("/update", updateNote);
router.get("/getAll", getNotes);
router.get("/get/noteId", getNoteById);

export default router;

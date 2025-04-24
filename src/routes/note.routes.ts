import { Router } from "express";
const router = Router();

import { isLoggedIn } from "../middlewares/auth.middlewares";
import {
  createNote,
  getNoteById,
  getNotes,
} from "../controllers/note.controllers";

router.use(isLoggedIn);
router.get("/getAll", getNotes);
router.get("/getNote/:id", getNoteById);
router.post("/create", createNote);

export default router;

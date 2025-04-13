import { Router } from "express";
const router = Router();

import {
  loginUser,
  registerUser,
  resendVerificationEmail,
  verifyUser,
  logoutUser,
} from "../controllers/user.controllers";

// Auth routes
router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.post("/resend-email", resendVerificationEmail);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

export default router;

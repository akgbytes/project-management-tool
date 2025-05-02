import { Router } from "express";
const router = Router();

import {
  registerUser,
  verifyUser,
  resendVerificationEmail,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
} from "../controllers/auth.controllers";
import { isLoggedIn } from "../middlewares/auth.middlewares";
import { upload } from "../middlewares/multer.middlewares";

router.post("/register", upload.single("avatar"), registerUser);
router.get("/verify/:token", verifyUser);
router.post("/resend-email", resendVerificationEmail);
router.post("/login", loginUser);
router.post("/logout", isLoggedIn, logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/refresh-tokens", refreshAccessToken);

export default router;

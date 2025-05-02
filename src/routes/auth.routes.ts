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
  getMe,
} from "../controllers/auth.controllers";
import { isLoggedIn } from "../middlewares/auth.middlewares";
import { upload } from "../middlewares/multer.middlewares";
import {
  authLimiter,
  emailsLimiter,
} from "../middlewares/rateLimiter.middlewares";

router.post("/register", upload.single("avatar"), registerUser);
router.get("/verify/:token", verifyUser);
router.post("/resend-email", emailsLimiter, resendVerificationEmail);
router.post("/login", authLimiter, loginUser);
router.post("/logout", isLoggedIn, logoutUser);
router.post("/password/forgot", emailsLimiter, forgotPassword);
router.post("/password/reset/:token", resetPassword);
router.get("/refresh-tokens", refreshAccessToken);
router.get("/me", isLoggedIn, getMe);

export default router;

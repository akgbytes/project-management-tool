import { Router } from "express";
const router = Router();
import { registerUser } from "../controllers/user.controllers";

router.route("/register").post(registerUser);
// router.route("/verify").get(registerUser);

export default router;

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import crypto from "crypto";
import {
  validateLoginData,
  validateRegisterData,
  validateEmail,
  validateResetPasswordData,
} from "../validations/user.validations";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import { User } from "../models/user.models";
import { ApiResponse } from "../utils/ApiResponse";
import { sendVerificationMail, sendResetPasswordMail } from "../utils/sendMail";
import { handleZodError } from "../utils/handleZodError";
import jwt from "jsonwebtoken";
import { env } from "../configs/env";
import { uploadOnCloudinary } from "../configs/cloudinary";
import logger from "../utils/logger";

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username, fullName } = handleZodError(
    validateRegisterData(req.body)
  );

  logger.info("Register attempt", { email });

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new CustomError(ResponseStatus.Conflict, "Email already registered");
  }

  let user = await User.create({
    email,
    password,
    username,
    fullName,
  });

  const { unHashedToken, hashedToken, tokenExpiry } = user.generateToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  // Saving avatar in db
  let imageUrl;
  if (req.file) {
    imageUrl = await uploadOnCloudinary(req.file.path);
    logger.info("Avatar uploaded to Cloudinary", { email });
  }

  if (imageUrl) {
    user.avatar = imageUrl.secure_url;
  }

  await user.save();

  await sendVerificationMail(user.fullName, user.email, unHashedToken);
  logger.info("Verification email sent", { email });

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        user.toJSON(),
        "User registered successfully. Please verify your email"
      )
    );
});

const verifyUser = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token)
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Verification token is required"
    );

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new CustomError(
      ResponseStatus.Unauthorized,
      "Invalid or expired token"
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpiry = null;

  await user.save();
  logger.info("User email verified", { email: user.email });

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        null,
        "Email verified successfully"
      )
    );
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = handleZodError(validateEmail(req.body));

  if (!email) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Email address is required to send verification link."
    );
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError(
      ResponseStatus.Unauthorized,
      "No account found with this email address."
    );
  }

  if (user.isEmailVerified) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Email is already verified"
    );
  }

  const { hashedToken, tokenExpiry, unHashedToken } = user.generateToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save();
  await sendVerificationMail(user.fullName, user.email, unHashedToken);

  logger.info("Verification email resent", {
    email: user.email,
  });

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        null,
        "Verification mail sent successfully. Please check your inbox"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = handleZodError(validateLoginData(req.body));

  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError(ResponseStatus.NotFound, "User does not exist");
  }

  if (!user.isEmailVerified) {
    throw new CustomError(ResponseStatus.Forbidden, "Email is not verified");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new CustomError(ResponseStatus.Unauthorized, "Invalid credentials");
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  logger.info("User logged in", { email: user.email });

  res
    .status(ResponseStatus.Success)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: env.NODE_ENV === "production",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: env.NODE_ENV === "production",
    })
    .json(new ApiResponse(ResponseStatus.Success, null, "Login successful"));
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, {
    refreshToken: null,
  });

  logger.info("User logged out", { email: user?.email });

  res
    .status(ResponseStatus.Success)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(
      new ApiResponse(ResponseStatus.Success, null, "Logged out successfully")
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = handleZodError(validateEmail(req.body));

  const user = await User.findOne({ email });
  // dont tell user does not exist due to security reasons
  if (!user) {
    return res
      .status(ResponseStatus.Success)
      .json(
        new ApiResponse(
          ResponseStatus.Success,
          null,
          "If an account exists, a reset link has been sent to the email"
        )
      );
  }

  const { hashedToken, tokenExpiry, unHashedToken } = user.generateToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpiry = tokenExpiry;

  await user.save();

  await sendResetPasswordMail(user.fullName, user.email, unHashedToken);
  logger.info("Password reset email sent", {
    email: user.email,
  });

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        null,
        "If an account exists, a reset link has been sent to the email"
      )
    );
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = handleZodError(validateResetPasswordData(req.body));

  if (!token) {
    throw new CustomError(ResponseStatus.BadRequest, "Reset token is missing");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new CustomError(
      ResponseStatus.Unauthorized,
      "Token is invalid or expired"
    );
  }

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpiry = null;
  await user.save();

  logger.info("Password reset successful", { email: user.email });

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        null,
        "Password reset successfully"
      )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    throw new CustomError(ResponseStatus.Unauthorized, "Unauthorized request");
  }

  let decodedToken: any;
  try {
    decodedToken = jwt.verify(incomingRefreshToken, env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Invalid or expired refresh token"
    );
  }

  const user = await User.findById(decodedToken._id);
  if (!user) {
    throw new CustomError(ResponseStatus.Unauthorized, "Invalid token");
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new CustomError(
      ResponseStatus.Forbidden,
      "Refresh token has been used or is invalid"
    );
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  const cookieOptions = {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  logger.info("Access token refreshed", { email: user.email });

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, null, "Access token refreshed successfully"));
});

const getMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new CustomError(ResponseStatus.NotFound, "User not found");
  }

  logger.info("User profile fetched", { email: user.email });
  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        user.toJSON(),
        "User profile fetched successfully"
      )
    );
});

export {
  registerUser,
  verifyUser,
  resendVerificationEmail,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  getMe,
};

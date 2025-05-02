import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import crypto from "crypto";
import {
  validateLoginData,
  validateRegisterData,
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

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, username, fullName } = handleZodError(
    validateRegisterData(req.body)
  );

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

  if (!user) {
    throw new CustomError(
      ResponseStatus.InternalServerError,
      "User registration failed"
    );
  }

  const { unHashedToken, hashedToken, tokenExpiry } = user.generateToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  // avatar url on db
  let imageUrl;
  if (req.file) {
    imageUrl = await uploadOnCloudinary(req.file.path);
  }

  if (imageUrl && req.file) {
    user.avatar = imageUrl.secure_url;
  }

  await user.save();

  await sendVerificationMail(user.username, user.email, unHashedToken);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        {},
        "User registered successfully. Please verify your email"
      )
    );
});

const verifyUser = asyncHandler(async (req: Request, res: Response) => {
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

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(ResponseStatus.Success, {}, "Email verified successfully")
    );
});

const resendVerificationEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

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

    await sendVerificationMail(user.username, user.email, unHashedToken);
    res
      .status(ResponseStatus.Success)
      .json(
        new ApiResponse(
          ResponseStatus.Success,
          {},
          "Verification mail sent successfully. Please check your inbox"
        )
      );
  }
);

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = handleZodError(validateLoginData(req.body));

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError(ResponseStatus.NotFound, "User does not exist");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new CustomError(ResponseStatus.Unauthorized, "Invalid credentials");
  }

  // generating access n refresh token
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  res
    .status(ResponseStatus.Success)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
    })
    .json(new ApiResponse(ResponseStatus.Success, {}, "Login successful"));
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(
    { _id: req.user._id },
    {
      refreshToken: null,
    }
  );

  res
    .status(ResponseStatus.Success)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(
      new ApiResponse(ResponseStatus.Success, {}, "Logged out successfully")
    );
});

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new CustomError(ResponseStatus.BadRequest, "Missing required fields");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new CustomError(ResponseStatus.NotFound, "User does not exits");
  }

  const { hashedToken, tokenExpiry, unHashedToken } = user.generateToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpiry = tokenExpiry;

  await user.save();
  await sendResetPasswordMail(user.username, user.email, unHashedToken);

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        {},
        "If an account exists, a reset link has been sent to the email"
      )
    );
});

const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpiry: { gt: new Date() },
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

  res
    .status(ResponseStatus.Success)
    .json(
      new ApiResponse(ResponseStatus.Success, {}, "Password reset successfully")
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
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, {}, "Access token refreshed successfully"));
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
};

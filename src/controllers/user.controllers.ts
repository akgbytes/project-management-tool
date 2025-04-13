import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  validateLoginData,
  validateRegisterData,
} from "../validations/user.validations";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import { User } from "../models/user.models";
import { ApiResponse } from "../utils/ApiResponse";
import { sendVerificationMail } from "../utils/sendMail";
import { handleZodError } from "../utils/handleZodError";

// avatar handle logic remaining
const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, username, avatar, fullName } = handleZodError(
    validateRegisterData(req.body)
  );

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new CustomError(ResponseStatus.Conflict, "Email already registered");
  }

  let user = await User.create({ email, password, username, avatar, fullName });

  if (!user) {
    throw new CustomError(
      ResponseStatus.InternalServerError,
      "User registration failed"
    );
  }

  const { hashedToken, tokenExpiry, unHashedToken } = user.generateToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
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

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpiry: { $gt: new Date() },
  });

  if (!user) {
    throw new CustomError(
      ResponseStatus.Unauthorized,
      "Invalid or expired token"
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

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

export { registerUser, verifyUser, resendVerificationEmail };

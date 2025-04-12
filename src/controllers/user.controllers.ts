import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validateRegisterData } from "../validations/user.validations";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import { User } from "../models/user.models";
import { ApiResponse } from "../utils/ApiResponse";
import { sendVerificationMail } from "../utils/sendMail";
import { handleZodError } from "../utils/handleZodError";

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
    .status(200)
    .json(
      new ApiResponse(
        ResponseStatus.Success,
        {},
        "User registered successfully. Please verify your email"
      )
    );
});

export { registerUser };

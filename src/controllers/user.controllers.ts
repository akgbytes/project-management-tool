import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { validateRegisterData } from "../validations/user.validations";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import { User } from "../models/user.models";
import { ApiResponse } from "../utils/ApiResponse";

const registerUser = asyncHandler(async (req: Request, res: Response) => {});

export { registerUser };

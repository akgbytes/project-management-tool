import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/CustomError";
import jwt from "jsonwebtoken";
import { ResponseStatus } from "../utils/constants";
import { env } from "../configs/env";

const isLoggedIn = (req: Request, res: Response, next: NextFunction) => {
  const { accessToken } = req.cookies;
  if (!accessToken)
    throw new CustomError(ResponseStatus.Unauthorized, "Unauthorized request");

  try {
    const decoded = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET);
    req.body.user = decoded;
    next();
  } catch (error) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      "Invalid or expired access token"
    );
  }
};

export { isLoggedIn };

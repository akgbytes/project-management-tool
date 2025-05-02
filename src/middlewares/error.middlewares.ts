import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import logger from "../utils/logger";

const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  let customError: CustomError;

  if (error instanceof CustomError) {
    customError = error;
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    customError = new CustomError(409, `Duplicate value for field: ${field}`);
  } else {
    customError = new CustomError(
      ResponseStatus.InternalServerError,
      error.message || "Internal Server Error",
    );
  }

  logger.error(customError.message);

  res.status(customError.statusCode).json({
    success: customError.success,
    message: customError.message,
    statusCode: customError.statusCode,
    data: customError.data,
  });
};

export { errorHandler };

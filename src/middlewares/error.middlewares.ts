import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";
import logger from "../utils/logger";

const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let customError: CustomError;

  if (!(error instanceof CustomError)) {
    customError = new CustomError(
      ResponseStatus.InternalServerError,
      error.message || "Internal Server Error"
    );
  } else {
    customError = error;
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

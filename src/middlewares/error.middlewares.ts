import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";

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

  res.status(customError.statusCode).json({
    success: customError.success,
    message: customError.message,
    statusCode: customError.statusCode,
    data: customError.data,
  });
};

export { errorHandler };

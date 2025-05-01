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

  if (error.name === "ValidationError") {
    const message = Object.values(error.errors);

    console.log("from middleware :  ", message);
    customError = new CustomError(400, `Validation error : ${message}`);
  }
  // Mongoose Cast Error (invalid ObjectId)
  else if (error.name === "CastError") {
    customError = new CustomError(400, `Invalid ${error.path}: ${error.value}`);
  }
  // MongoDB Duplicate Key Error
  else if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    customError = new CustomError(409, `Duplicate value for field: ${field}`);
  }
  // already an instance of CustomError
  else if (error instanceof CustomError) {
    customError = error;
  }

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

import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/CustomError";

const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let customError: CustomError;

  // Mongoose Validation Error
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
  // convert generic error as an instance of CustomError
  else {
    customError = new CustomError(
      500,
      error.message || "Internal Server Error"
    );
  }

  res.status(customError.statusCode).json({
    success: false,
    message: customError.message,
  });
};

export { errorHandler };

import mongoose from "mongoose";
import { CustomError } from "./CustomError";
import { ResponseStatus } from "./constants";

export const validateObjectId = (id: string, entityName: string): void => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new CustomError(
      ResponseStatus.BadRequest,
      `Invalid ${entityName} ID`,
    );
  }
};

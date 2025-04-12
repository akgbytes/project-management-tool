import { SafeParseReturnType } from "zod";
import { CustomError } from "./CustomError";
import { ResponseStatus } from "./constants";

const handleZodError = (result: SafeParseReturnType<any, any>) => {
  if (!result.success) {
    const missing = result.error.issues.find(
      (issue) => issue.code === "invalid_type" && issue.received === "undefined"
    );

    if (missing) {
      throw new CustomError(
        ResponseStatus.BadRequest,
        "Missing required fields"
      );
    }

    throw new CustomError(
      ResponseStatus.BadRequest,
      result.error.issues[0].message
    );
  }

  return result.data;
};

export { handleZodError };

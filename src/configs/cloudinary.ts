import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";
import fs from "fs";
import { CustomError } from "../utils/CustomError";
import { ResponseStatus } from "../utils/constants";

cloudinary.config({
  cloud_name: env.CLOUDINARY_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_SECRET_KEY,
});

export const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
    });

    // fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // fs.unlinkSync(localFilePath);
    throw new CustomError(
      ResponseStatus.InternalServerError,
      "Failed to upload on cloudinary"
    );
  }
};

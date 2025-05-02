import multer from "multer";
import path from "path";
import { allowedMimeTypes, ResponseStatus } from "../utils/constants";
import { CustomError } from "../utils/CustomError";
import { env } from "../configs/env";

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    // including a random char bcuz collision could still happen if
    // two user upload same file(avatar.png) at the same time
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extention = path.extname(file.originalname);
    // avatar-123.png
    cb(null, `${file.fieldname}-${uniqueSuffix}${extention}`);
  },
});

// filter file type for attachments
const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new CustomError(ResponseStatus.BadRequest, "Unsupported file type"));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1000 * 1000,
  },
});

export const uploadAttachments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1000 * 1000,
  },
}).array("attachments", env.MAX_ATTACHMENTS);

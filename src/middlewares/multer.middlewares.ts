import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, "./public/images");
  },
  filename: function (req, file, cb) {
    // including a random character bcuz collision could still happen if two user upload same file(avatar.png) at the same time
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extention = path.extname(file.originalname);
    // avatar-123.png
    cb(null, `${file.fieldname}-${uniqueSuffix}${extention}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    // 1mb
    fileSize: 1 * 1000 * 1000,
  },
});

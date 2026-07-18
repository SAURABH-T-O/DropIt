import multer from "multer";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const tempPath = path.join(process.cwd(), "public", "temp");

fs.mkdirSync(tempPath, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempPath);
  },

  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${nanoid()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});
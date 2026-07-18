import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (err instanceof multer.MulterError) {
    error = new ApiError(413, "File is too large. Maximum size is 500 MB.");
  }

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: error.message || "Internal server error",
    errors: error.errors || []
  });
};

export { errorMiddleware };
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },
    relativePath: {
      type: String,
      required: true
    },
    storedPath: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimetype: {
      type: String
    }
  },
  { _id: false }
);

const shareSchema = new mongoose.Schema(
  {
    shareId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    files: [fileSchema],
    totalSize: {
      type: Number,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 12 * 60 * 60 * 1000),
      index: true
    }
  },
  { timestamps: true }
);

export const Share = mongoose.model("Share", shareSchema);
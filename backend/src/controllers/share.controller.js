import fs from "fs";
import path from "path";
import archiver from "archiver";
import { nanoid } from "nanoid";
import { Share } from "../models/share.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MAX_SIZE = 500 * 1024 * 1024;

const sharesPath = path.join(process.cwd(), "public", "shares");
const zipsPath = path.join(process.cwd(), "public", "zips");

fs.mkdirSync(sharesPath, { recursive: true });
fs.mkdirSync(zipsPath, { recursive: true });

const cleanRelativePath = (input) => {
  return input
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\.\./g, "")
    .replace(/[<>:"|?*]/g, "_");
};

const removeUploadedTempFiles = (files = []) => {
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
};

const createZip = (share) => {
  return new Promise((resolve, reject) => {
    const zipPath = path.join(
      zipsPath,
      `dropit-${share.shareId}-${Date.now()}.zip`
    );

    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(zipPath));
    archive.on("error", reject);

    archive.pipe(output);

    for (const file of share.files) {
      archive.file(file.storedPath, {
        name: file.relativePath
      });
    }

    archive.finalize();
  });
};

const createShare = asyncHandler(async (req, res) => {
  const files = req.files || [];

  if (!files.length) {
    throw new ApiError(400, "No files uploaded.");
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > MAX_SIZE) {
    removeUploadedTempFiles(files);
    throw new ApiError(413, "Upload exceeds 500 MB limit.");
  }

  const shareId = nanoid(10);
  const shareFolder = path.join(sharesPath, shareId);

  fs.mkdirSync(shareFolder, { recursive: true });

  const relativePaths = req.body.relativePaths;

  const savedFiles = files.map((file, index) => {
    const rawRelativePath = Array.isArray(relativePaths)
      ? relativePaths[index]
      : relativePaths || file.originalname;

    const safeRelativePath = cleanRelativePath(
      rawRelativePath || file.originalname
    );

    const finalPath = path.join(shareFolder, safeRelativePath);
    const finalDir = path.dirname(finalPath);

    fs.mkdirSync(finalDir, { recursive: true });
    fs.renameSync(file.path, finalPath);

    return {
      originalName: file.originalname,
      relativePath: safeRelativePath,
      storedPath: finalPath,
      size: file.size,
      mimetype: file.mimetype
    };
  });

  const share = await Share.create({
    shareId,
    files: savedFiles,
    totalSize
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        shareId: share.shareId,
        link: `${process.env.CLIENT_URL}/?share=${share.shareId}`,
        totalSize: share.totalSize,
        fileCount: share.files.length
      },
      "Share created successfully."
    )
  );
});

const getShare = asyncHandler(async (req, res) => {
  const { shareId } = req.params;

  const share = await Share.findOne({ shareId });

  if (!share) {
    throw new ApiError(404, "Share not found.");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        shareId: share.shareId,
        fileCount: share.files.length,
        totalSize: share.totalSize,
        createdAt: share.createdAt,
        files: share.files.map((file) => ({
          name: file.relativePath,
          size: file.size,
          type: file.mimetype
        }))
      },
      "Share fetched successfully."
    )
  );
});

const downloadShare = asyncHandler(async (req, res) => {
  const { shareId } = req.params;

  const share = await Share.findOne({ shareId });

  if (!share) {
    throw new ApiError(404, "Share not found.");
  }

  const zipPath = await createZip(share);
  const zipSize = fs.statSync(zipPath).size;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Length", zipSize);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="dropit-${share.shareId}.zip"`
  );

  const stream = fs.createReadStream(zipPath);

  stream.pipe(res);

  stream.on("close", () => {
    fs.unlink(zipPath, () => {});
  });
});

const downloadSelectedShare = asyncHandler(async (req, res) => {
  const { shareId } = req.params;
  const { selectedFiles } = req.body;

  if (!Array.isArray(selectedFiles) || selectedFiles.length === 0) {
    throw new ApiError(400, "Please select at least one file to download.");
  }

  const share = await Share.findOne({ shareId });

  if (!share) {
    throw new ApiError(404, "Share not found.");
  }

  const allowedFiles = share.files.filter((file) =>
    selectedFiles.includes(file.relativePath)
  );

  if (!allowedFiles.length) {
    throw new ApiError(400, "No valid files selected.");
  }

  const selectedShare = {
    shareId: share.shareId,
    files: allowedFiles
  };

  const zipPath = await createZip(selectedShare);
  const zipSize = fs.statSync(zipPath).size;

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Length", zipSize);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="dropit-${share.shareId}-selected.zip"`
  );

  const stream = fs.createReadStream(zipPath);

  stream.pipe(res);

  stream.on("close", () => {
    fs.unlink(zipPath, () => {});
  });
});

export { createShare, getShare, downloadShare, downloadSelectedShare };
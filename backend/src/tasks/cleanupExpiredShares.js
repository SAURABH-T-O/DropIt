import fs from "fs";
import path from "path";
import { Share } from "../models/share.model.js";

const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const deleteEmptyParentFolders = (files) => {
  const folders = [
    ...new Set(files.map((file) => path.dirname(file.storedPath)))
  ].sort((a, b) => b.length - a.length);

  for (const folder of folders) {
    try {
      if (fs.existsSync(folder) && fs.readdirSync(folder).length === 0) {
        fs.rmdirSync(folder);
      }
    } catch {
      // Ignore cleanup failures
    }
  }
};

export const cleanupExpiredShares = async () => {
  const expiredShares = await Share.find({
    expiresAt: {
      $lte: new Date()
    }
  });

  for (const share of expiredShares) {
    for (const file of share.files) {
      deleteFileIfExists(file.storedPath);
    }

    deleteEmptyParentFolders(share.files);

    await Share.deleteOne({
      _id: share._id
    });

    console.log(`Deleted expired share: ${share.shareId}`);
  }
};

export const startCleanupJob = () => {
  cleanupExpiredShares();

  setInterval(() => {
    cleanupExpiredShares().catch((error) => {
      console.error("Cleanup job failed:", error.message);
    });
  }, 10 * 60 * 1000);
};
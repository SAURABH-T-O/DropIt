import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import {
  createShare,
  getShare,
  downloadShare,
  downloadSelectedShare
} from "../controllers/share.controller.js";

const router = Router();

router.route("/upload").post(upload.array("files"), createShare);
router.route("/:shareId").get(getShare);
router.route("/:shareId/download").get(downloadShare);
router.route("/:shareId/download-selected").post(downloadSelectedShare);

export default router;
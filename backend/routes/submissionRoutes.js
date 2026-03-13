const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const router = express.Router();
const {
  createPortal,
  getPortals,
  submitLink,
  getAllSubmissions,
  deleteSubmission,
  bulkDeleteSubmissions,
  updatePortal,
  deletePortal,
  getSubmissionsByPortal,
  upsertSubmission,
} = require("../controllers/submissionController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const uploadDir = path.join(__dirname, "..", "uploads", "submissions");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${Date.now()}-${safeOriginal}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get("/portals", protect, getPortals);
router.post("/submit", protect, upload.single("file"), submitLink);
router.post("/admin/portals", protect, adminOnly, createPortal);
router.put("/admin/portals/:id", protect, adminOnly, updatePortal); // Update portal
router.delete("/admin/portals/:id", protect, adminOnly, deletePortal); // Delete portal
router.get("/admin/all", protect, adminOnly, getAllSubmissions);
router.get(
  "/admin/portal/:portalId",
  protect,
  adminOnly,
  getSubmissionsByPortal,
);
router.delete("/admin/:portalId", protect, adminOnly, bulkDeleteSubmissions);
router.delete("/admin/:teamId/:portalId", protect, adminOnly, deleteSubmission);
router.put("/admin/:teamId/:portalId", protect, adminOnly, upsertSubmission);

module.exports = router;

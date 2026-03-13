const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateEventName,
  updateProblemStatementsAccess,
} = require("../controllers/settingsController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", getSettings);
router.put("/event-name", protect, adminOnly, updateEventName);
router.put(
  "/problem-statements-access",
  protect,
  adminOnly,
  updateProblemStatementsAccess,
);

module.exports = router;

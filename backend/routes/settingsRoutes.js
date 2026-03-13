const express = require("express");
const router = express.Router();
const {
  getSettings,
  updateEventName,
  updateRegistrationAccess,
  updateProblemStatementsAccess,
} = require("../controllers/settingsController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/", getSettings);
router.put("/event-name", protect, adminOnly, updateEventName);
router.put(
  "/registration-access",
  protect,
  adminOnly,
  updateRegistrationAccess,
);
router.put(
  "/problem-statements-access",
  protect,
  adminOnly,
  updateProblemStatementsAccess,
);

module.exports = router;

const Settings = require("../models/Settings");

// GET /api/settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({
      eventName: settings.eventName,
      problemStatementsOpen: settings.problemStatementsOpen,
      updatedAt: settings.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

// PUT /api/settings/event-name
exports.updateEventName = async (req, res) => {
  try {
    const { eventName } = req.body;
    if (!eventName || !eventName.trim()) {
      return res.status(400).json({ message: "eventName is required" });
    }
    const settings = await Settings.findOneAndUpdate(
      {},
      { eventName: eventName.trim(), updatedAt: new Date() },
      { new: true, upsert: true },
    );
    res.json({ eventName: settings.eventName, updatedAt: settings.updatedAt });
  } catch (err) {
    res.status(500).json({ message: "Failed to update event name" });
  }
};

// PUT /api/settings/problem-statements-access
exports.updateProblemStatementsAccess = async (req, res) => {
  try {
    const { isOpen } = req.body;
    if (typeof isOpen !== "boolean") {
      return res.status(400).json({ message: "isOpen must be boolean" });
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      { problemStatementsOpen: isOpen, updatedAt: new Date() },
      { new: true, upsert: true },
    );

    res.json({
      eventName: settings.eventName,
      problemStatementsOpen: settings.problemStatementsOpen,
      updatedAt: settings.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update problem access" });
  }
};

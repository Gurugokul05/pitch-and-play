const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  eventName: { type: String, default: "Hackathon 2026" },
  problemStatementsOpen: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Settings", SettingsSchema);

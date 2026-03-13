const mongoose = require("mongoose");

const submissionPortalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  submissionType: {
    type: String,
    enum: ["file", "link"],
    default: "file",
  },
  deadline: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SubmissionPortal", submissionPortalSchema);

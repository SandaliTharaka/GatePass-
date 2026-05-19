const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipientServiceNo: { type: String, index: true },
    recipientRole: { type: String, index: true },
    branch: { type: String, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "approval", "rejected", "completed", "warning"],
      default: "info",
    },
    referenceNumber: { type: String, index: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "Request" },
    actionPath: { type: String },
    eventKey: { type: String, index: true },
    readBy: [{ type: String }],
    deletedBy: [{ type: String }],
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ recipientServiceNo: 1, createdAt: -1 });
NotificationSchema.index({ recipientRole: 1, createdAt: -1 });
NotificationSchema.index({ branch: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);

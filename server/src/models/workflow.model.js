import mongoose from "mongoose";

const workflowStepSchema = new mongoose.Schema(
  {
    order: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "pending", "signed"],
      default: "waiting",
    },
    signedAt: {
      type: Date,
      default: null,
    },
    signatureText: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    steps: {
      type: [workflowStepSchema],
      validate: [(items) => items.length > 0, "Workflow requires at least one step."],
    },
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
      index: true,
    },
  },
  { timestamps: true }
);

export const Workflow = mongoose.model("Workflow", workflowSchema);

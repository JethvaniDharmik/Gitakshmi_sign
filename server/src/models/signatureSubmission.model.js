import mongoose from "mongoose";

const fieldEntrySchema = new mongoose.Schema(
  {
    fieldId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["signature", "date", "checkbox", "text"],
      required: true,
    },
    label: {
      type: String,
      default: "",
      trim: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    page: {
      type: Number,
      default: 1,
    },
    x: {
      type: Number,
      required: true,
    },
    y: {
      type: Number,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    value: {
      type: String,
      default: "",
    },
    checked: {
      type: Boolean,
      default: false,
    },
    signatureDataUrl: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const signatureSubmissionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    workflow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    fields: {
      type: [fieldEntrySchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["draft", "submitted"],
      default: "draft",
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

signatureSubmissionSchema.index({ document: 1, workflow: 1, user: 1 }, { unique: true });

export const SignatureSubmission = mongoose.model("SignatureSubmission", signatureSubmissionSchema);

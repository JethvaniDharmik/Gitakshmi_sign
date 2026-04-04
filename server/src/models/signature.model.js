import mongoose from "mongoose";

const signatureSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    signer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Signer",
      required: true,
      index: true,
    },
    imagePath: {
      type: String,
      required: true,
    },
    page: {
      type: Number,
      default: 1,
    },
    x: {
      type: Number,
      default: 100,
    },
    y: {
      type: Number,
      default: 100,
    },
    width: {
      type: Number,
      default: 160,
    },
    height: {
      type: Number,
      default: 60,
    },
  },
  { timestamps: true }
);

export const Signature = mongoose.model("Signature", signatureSchema);

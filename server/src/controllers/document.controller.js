import path from "path";
import fs from "fs";
import { Document } from "../models/document.model.js";
import { Signer } from "../models/signer.model.js";
import { Signature } from "../models/signature.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import { generateSecureRandomToken } from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import { streamRemoteWithCloudinaryFallback } from "../utils/cloudinaryDelivery.js";

const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5173";
const uploadRoot = path.join(process.cwd(), "uploads");

const deleteLocalFile = (filePath) => {
  if (!filePath || typeof filePath !== "string") return;
  if (filePath.startsWith("http")) return;
  if (!path.resolve(filePath).startsWith(uploadRoot)) return;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;

    if (!title) {
      return res.status(400).json({ message: "Document title is required." });
    }

    if (!file) {
      return res.status(400).json({ message: "File is required." });
    }

    const doc = await Document.create({
      owner: req.user._id,
      title,
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    await AuditLog.create({
      document: doc._id,
      actorUser: req.user._id,
      action: "DOCUMENT_UPLOADED",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(201).json({
      message: "Document uploaded successfully.",
      document: doc,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload document.", error: error.message });
  }
};

export const getMyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ owner: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ documents });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch documents." });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const signers = await Signer.find({ document: document._id }).sort({ createdAt: -1 });
    return res.status(200).json({ document, signers });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch document." });
  }
};

export const sendSignRequest = async (req, res) => {
  try {
    const { signerName, signerEmail, expiresInDays = 7 } = req.body;
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    if (!signerName || !signerEmail) {
      return res.status(400).json({ message: "Signer name and email are required." });
    }

    const token = generateSecureRandomToken(24);
    const signer = await Signer.create({
      document: document._id,
      name: signerName,
      email: signerEmail.toLowerCase(),
      signToken: token,
      tokenExpiresAt: new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000),
    });

    const signLink = `${APP_BASE_URL}/sign/${token}`;
    await sendEmail({
      to: signer.email,
      subject: `Sign request for "${document.title}"`,
      html: `
        <p>Hello ${signer.name},</p>
        <p>You have received a document sign request on GitakshmiSign.</p>
        <p><a href="${signLink}">Click here to review and sign</a></p>
        <p>This link expires on ${signer.tokenExpiresAt.toDateString()}.</p>
      `,
    });

    await AuditLog.create({
      document: document._id,
      signer: signer._id,
      actorUser: req.user._id,
      action: "SIGN_REQUEST_SENT",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      metadata: { signerEmail: signer.email },
    });

    return res.status(201).json({
      message: "Sign request sent.",
      signer,
      signLink,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send sign request.", error: error.message });
  }
};

export const streamDocumentFile = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    if (document.filePath.startsWith("http")) {
      try {
        await streamRemoteWithCloudinaryFallback({
          url: document.filePath,
          publicId: document.fileName,
          mimeType: document.mimeType || "application/pdf",
          res,
          defaultContentType: document.mimeType || "application/pdf",
        });
        return;
      } catch {
        return res.status(422).json({
          message:
            "This document source is no longer accessible. Please upload the PDF again and send a new sign request.",
        });
      }
    }

    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: "File not found." });
    }

    res.setHeader("Content-Type", document.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(document.filePath)}"`);

    const stream = fs.createReadStream(document.filePath);
    return stream.pipe(res);
  } catch (error) {
    return res.status(500).json({ message: "Failed to stream document." });
  }
};

export const getAuditTrail = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const logs = await AuditLog.find({ document: document._id })
      .populate("signer", "name email")
      .populate("actorUser", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ logs });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch audit logs." });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const signers = await Signer.find({ document: document._id }).select("_id");
    const signerIds = signers.map((signer) => signer._id);

    await Promise.all([
      Signature.deleteMany({ document: document._id }),
      Signer.deleteMany({ document: document._id }),
      AuditLog.deleteMany({ document: document._id }),
      Document.deleteOne({ _id: document._id }),
    ]);

    deleteLocalFile(document.filePath);
    deleteLocalFile(document.signedFilePath);

    if (signerIds.length) {
      await Signature.deleteMany({ signer: { $in: signerIds } });
    }

    return res.status(200).json({ message: "Document deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete document.", error: error.message });
  }
};

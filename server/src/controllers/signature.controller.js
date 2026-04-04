import fs from "fs";
import path from "path";
import { promises as fsp } from "fs";
import { PDFDocument } from "pdf-lib";
import { Signer } from "../models/signer.model.js";
import { Signature } from "../models/signature.model.js";
import { Document } from "../models/document.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import {
  extractCloudinaryPublicId,
  fetchRemoteBufferWithCloudinaryFallback,
  streamRemoteWithCloudinaryFallback,
} from "../utils/cloudinaryDelivery.js";

const ensureDir = async (dirPath) => {
  await fsp.mkdir(dirPath, { recursive: true });
};

const decodeDataUrl = (dataUrl) => {
  const matches = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
  if (!matches) return null;
  return {
    mimeType: matches[1],
    data: Buffer.from(matches[2], "base64"),
  };
};

const placeSignatureOnPdf = async ({
  sourcePdfPath,
  sourcePublicId,
  sourceMimeType = "application/pdf",
  targetPdfPath,
  imageBuffer,
  mimeType,
  page = 1,
  x = 100,
  y = 100,
  width = 160,
  height = 60,
}) => {
  let existingPdfBytes;
  if (sourcePdfPath.startsWith("http")) {
    existingPdfBytes = await fetchRemoteBufferWithCloudinaryFallback({
      url: sourcePdfPath,
      publicId: sourcePublicId,
      mimeType: sourceMimeType,
    });
  } else {
    existingPdfBytes = await fsp.readFile(sourcePdfPath);
  }

  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const pages = pdfDoc.getPages();
  const pageIndex = Math.max(0, Math.min(page - 1, pages.length - 1));
  const selectedPage = pages[pageIndex];

  const embeddedImage =
    mimeType === "image/png"
      ? await pdfDoc.embedPng(imageBuffer)
      : await pdfDoc.embedJpg(imageBuffer);

  selectedPage.drawImage(embeddedImage, {
    x,
    y,
    width,
    height,
  });

  const modifiedPdfBytes = await pdfDoc.save();
  await fsp.writeFile(targetPdfPath, modifiedPdfBytes);
};

export const getSignRequestByToken = async (req, res) => {
  try {
    const signer = await Signer.findOne({ signToken: req.params.token }).populate("document");
    if (!signer) {
      return res.status(404).json({ message: "Invalid signing link." });
    }
    if (signer.tokenExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "Signing link has expired." });
    }

    if (signer.status === "Pending") {
      signer.status = "Viewed";
      signer.viewedAt = new Date();
      await signer.save();

      await Document.findByIdAndUpdate(signer.document._id, { status: "Viewed" });

      await AuditLog.create({
        document: signer.document._id,
        signer: signer._id,
        action: "DOCUMENT_VIEWED",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    return res.status(200).json({
      signer: {
        id: signer._id,
        name: signer.name,
        email: signer.email,
        status: signer.status,
      },
      document: {
        id: signer.document._id,
        title: signer.document.title,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load signing request." });
  }
};

export const signDocumentByToken = async (req, res) => {
  try {
    const { signatureDataUrl, page = 1, x = 100, y = 100, width = 160, height = 60 } = req.body;
    if (!signatureDataUrl) {
      return res.status(400).json({ message: "Signature image is required." });
    }

    const decoded = decodeDataUrl(signatureDataUrl);
    if (!decoded) {
      return res.status(400).json({ message: "Invalid signature image format." });
    }

    const signer = await Signer.findOne({ signToken: req.params.token });
    if (!signer) {
      return res.status(404).json({ message: "Invalid signing link." });
    }
    if (signer.tokenExpiresAt.getTime() < Date.now()) {
      return res.status(410).json({ message: "Signing link has expired." });
    }
    if (signer.status === "Signed") {
      return res.status(409).json({ message: "This document is already signed." });
    }

    const document = await Document.findById(signer.document);
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    // Handle directories locally for temporary files if needed
    const signaturesDir = path.join(process.cwd(), "uploads", "signatures");
    const signedDocsDir = path.join(process.cwd(), "uploads", "signed");
    await Promise.all([ensureDir(signaturesDir), ensureDir(signedDocsDir)]);

    const fileExt = decoded.mimeType === "image/png" ? "png" : "jpg";
    const signatureFileName = `signature-${signer._id}-${Date.now()}.${fileExt}`;
    const signatureLocalPath = path.join(signaturesDir, signatureFileName);
    await fsp.writeFile(signatureLocalPath, decoded.data);

    const signedLocalFileName = `signed-${document._id}-${Date.now()}.pdf`;
    const signedLocalPath = path.join(signedDocsDir, signedLocalFileName);
    await placeSignatureOnPdf({
      sourcePdfPath: document.filePath,
      sourcePublicId: document.fileName,
      sourceMimeType: document.mimeType,
      targetPdfPath: signedLocalPath,
      imageBuffer: decoded.data,
      mimeType: decoded.mimeType,
      page: Number(page),
      x: Number(x),
      y: Number(y),
      width: Number(width),
      height: Number(height),
    });

    await Signature.create({
      document: document._id,
      signer: signer._id,
      imagePath: signatureLocalPath,
      page: Number(page),
      x: Number(x),
      y: Number(y),
      width: Number(width),
      height: Number(height),
    });

    signer.status = "Signed";
    signer.signedAt = new Date();
    await signer.save();

    document.status = "Signed";
    document.signedAt = new Date();
    document.signedFilePath = signedLocalPath;
    await document.save();

    await AuditLog.create({
      document: document._id,
      signer: signer._id,
      action: "DOCUMENT_SIGNED",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
      message: "Document signed successfully.",
      signedDocumentUrl: `/api/sign/${req.params.token}/preview`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to sign document.", error: error.message });
  }
};

export const previewDocumentByToken = async (req, res) => {
  try {
    const signer = await Signer.findOne({ signToken: req.params.token });
    if (!signer) {
      return res.status(404).json({ message: "Invalid signing link." });
    }

    const document = await Document.findById(signer.document);
    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const filePath = document.signedFilePath || document.filePath;

    if (filePath.startsWith("http")) {
      const publicId =
        document.signedFilePath && filePath === document.signedFilePath
          ? extractCloudinaryPublicId(filePath)
          : document.fileName;
      try {
        await streamRemoteWithCloudinaryFallback({
          url: filePath,
          publicId,
          mimeType: "application/pdf",
          res,
          defaultContentType: "application/pdf",
        });
        return;
      } catch {
        return res.status(422).json({
          message:
            "This document source is no longer accessible. Please upload the PDF again and send a new sign request.",
        });
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    return res.status(500).json({ message: "Failed to preview document." });
  }
};

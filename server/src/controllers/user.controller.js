import fs from "fs";
import path from "path";
import { Document } from "../models/document.model.js";
import { SignatureSubmission } from "../models/signatureSubmission.model.js";
import { Workflow } from "../models/workflow.model.js";

const FIELD_TYPES = new Set(["signature", "date", "checkbox", "text"]);

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const normalizeFields = (fields = []) =>
  fields.map((item, index) => ({
    fieldId: String(item.fieldId || `field-${index + 1}`).trim(),
    type: String(item.type || "").trim().toLowerCase(),
    label: String(item.label || "").trim(),
    required: Boolean(item.required),
    page: Math.max(1, toNumber(item.page, 1)),
    x: toNumber(item.x),
    y: toNumber(item.y),
    width: Math.max(3, toNumber(item.width, 18)),
    height: Math.max(3, toNumber(item.height, 7)),
    value: String(item.value || ""),
    checked: Boolean(item.checked),
    signatureDataUrl: String(item.signatureDataUrl || ""),
  }));

const validateFields = (fields = []) => {
  if (!Array.isArray(fields) || fields.length === 0) {
    return "At least one field is required.";
  }

  for (const field of fields) {
    if (!FIELD_TYPES.has(field.type)) {
      return `Unsupported field type: ${field.type}`;
    }

    if (field.required) {
      if (field.type === "checkbox" && !field.checked) {
        return `Required checkbox '${field.label || field.fieldId}' is not checked.`;
      }

      if (field.type === "signature" && !field.signatureDataUrl) {
        return `Required signature field '${field.label || field.fieldId}' is empty.`;
      }

      if (field.type !== "signature" && field.type !== "checkbox" && !String(field.value || "").trim()) {
        return `Required field '${field.label || field.fieldId}' is empty.`;
      }
    }
  }

  return null;
};

const getAssignedWorkflow = (req, documentId) =>
  Workflow.findOne({
    company: req.user.company._id,
    document: documentId,
    "steps.user": req.user._id,
  }).populate("document", "title filePath status originalName mimeType");

const moveWorkflowToNextStep = async ({ workflow, document, currentStep, signatureText }) => {
  currentStep.status = "signed";
  currentStep.signedAt = new Date();
  currentStep.signatureText = signatureText;

  const nextStep = workflow.steps
    .filter((step) => step.status === "waiting")
    .sort((a, b) => a.order - b.order)[0];

  if (nextStep) {
    nextStep.status = "pending";
    workflow.status = "in_progress";
    if (document) {
      document.currentStep = nextStep.order;
      document.status = "in_progress";
    }
  } else {
    workflow.status = "completed";
    if (document) {
      document.currentStep = workflow.steps.length;
      document.status = "completed";
    }
  }

  await workflow.save();
  if (document) {
    await document.save();
  }
};

export const getAssignedDocuments = async (req, res) => {
  try {
    const workflows = await Workflow.find({
      company: req.user.company._id,
      "steps.user": req.user._id,
    })
      .populate("document", "title status originalName filePath currentStep totalSteps")
      .populate("steps.user", "name email role")
      .sort({ updatedAt: -1 });

    const assignedDocuments = workflows
      .filter((workflow) => workflow.document)
      .map((workflow) => {
        const myStep = workflow.steps.find((step) => step.user._id.toString() === req.user._id.toString());
        return {
          workflowId: workflow._id,
          workflowName: workflow.name,
          workflowStatus: workflow.status,
          myStep: {
            order: myStep?.order,
            status: myStep?.status,
            signedAt: myStep?.signedAt || null,
          },
          document: workflow.document,
        };
      });

    return res.status(200).json({ assignedDocuments });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch assigned documents." });
  }
};

export const signAssignedDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { signatureText } = req.body;

    if (!signatureText || !signatureText.trim()) {
      return res.status(400).json({ message: "signatureText is required to sign a document." });
    }

    const workflow = await getAssignedWorkflow(req, documentId);

    if (!workflow) {
      return res.status(404).json({ message: "Assigned workflow not found." });
    }

    const currentStep = workflow.steps.find((step) => step.user.toString() === req.user._id.toString());
    if (!currentStep) {
      return res.status(403).json({ message: "You are not part of this workflow." });
    }

    if (currentStep.status === "signed") {
      return res.status(409).json({ message: "This step is already signed." });
    }

    if (currentStep.status !== "pending") {
      return res.status(400).json({ message: "This step is not ready for signing yet." });
    }

    const document = await Document.findById(documentId);
    await moveWorkflowToNextStep({
      workflow,
      document,
      currentStep,
      signatureText: signatureText.trim(),
    });

    return res.status(200).json({ message: "Document signed successfully.", workflowStatus: workflow.status });
  } catch (error) {
    return res.status(500).json({ message: "Failed to sign document.", error: error.message });
  }
};

export const getSigningWorkspace = async (req, res) => {
  try {
    const { documentId } = req.params;
    const workflow = await getAssignedWorkflow(req, documentId);

    if (!workflow || !workflow.document) {
      return res.status(404).json({ message: "Assigned document not found." });
    }

    const myStep = workflow.steps.find((step) => step.user.toString() === req.user._id.toString());
    if (!myStep) {
      return res.status(403).json({ message: "You are not part of this workflow." });
    }

    const existingSubmission = await SignatureSubmission.findOne({
      document: workflow.document._id,
      workflow: workflow._id,
      user: req.user._id,
    }).sort({ updatedAt: -1 });

    const isRemote = String(workflow.document.filePath || "").startsWith("http");
    const pdfUrl = isRemote
      ? workflow.document.filePath
      : `/api/user/documents/${workflow.document._id}/file`;

    return res.status(200).json({
      document: {
        id: workflow.document._id,
        title: workflow.document.title,
        status: workflow.document.status,
        originalName: workflow.document.originalName,
      },
      workflow: {
        id: workflow._id,
        name: workflow.name,
        status: workflow.status,
      },
      myStep: {
        order: myStep.order,
        status: myStep.status,
      },
      pdfUrl,
      savedFields: existingSubmission?.fields || [],
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load signing workspace." });
  }
};

export const streamAssignedDocumentFile = async (req, res) => {
  try {
    const { documentId } = req.params;
    const workflow = await getAssignedWorkflow(req, documentId);

    if (!workflow || !workflow.document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const filePath = workflow.document.filePath;

    if (String(filePath).startsWith("http")) {
      return res.redirect(filePath);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "PDF file not found on server." });
    }

    res.setHeader("Content-Type", workflow.document.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${path.basename(filePath)}"`);
    fs.createReadStream(filePath).pipe(res);
    return undefined;
  } catch (error) {
    return res.status(500).json({ message: "Failed to stream document file." });
  }
};

export const submitSigningFields = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { fields } = req.body;

    const workflow = await getAssignedWorkflow(req, documentId);
    if (!workflow || !workflow.document) {
      return res.status(404).json({ message: "Assigned document not found." });
    }

    const currentStep = workflow.steps.find((step) => step.user.toString() === req.user._id.toString());
    if (!currentStep) {
      return res.status(403).json({ message: "You are not part of this workflow." });
    }
    if (currentStep.status === "signed") {
      return res.status(409).json({ message: "You have already submitted this signing step." });
    }
    if (currentStep.status !== "pending") {
      return res.status(400).json({ message: "This step is not active yet." });
    }

    const normalizedFields = normalizeFields(fields);
    const validationError = validateFields(normalizedFields);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const signatureField =
      normalizedFields.find((field) => field.type === "signature" && field.signatureDataUrl) || null;

    const submission = await SignatureSubmission.findOneAndUpdate(
      {
        document: workflow.document._id,
        workflow: workflow._id,
        user: req.user._id,
      },
      {
        $set: {
          company: req.user.company._id,
          fields: normalizedFields,
          status: "submitted",
          submittedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const signatureText =
      signatureField?.signatureDataUrl ||
      normalizedFields
        .filter((field) => field.type === "text")
        .map((field) => field.value)
        .find((value) => String(value || "").trim()) ||
      "Signed via interactive form";

    const document = await Document.findById(workflow.document._id);
    await moveWorkflowToNextStep({
      workflow,
      document,
      currentStep,
      signatureText: String(signatureText).slice(0, 2000),
    });

    return res.status(200).json({
      message: "Signing form submitted successfully.",
      submissionId: submission._id,
      workflowStatus: workflow.status,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to submit signing form.", error: error.message });
  }
};

import { ROLES } from "../constants/roles.js";
import { Document } from "../models/document.model.js";
import { User } from "../models/user.model.js";
import { Workflow } from "../models/workflow.model.js";

const MANAGEABLE_ROLES = [ROLES.COMPANY_ADMIN, ROLES.HR, ROLES.EMPLOYEE];

export const createTeamMember = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required." });
    }

    if (!MANAGEABLE_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role for company member." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      company: req.user.company._id,
    });

    return res.status(201).json({
      message: "Team member added.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create team member.", error: error.message });
  }
};

export const getCompanyUsers = async (req, res) => {
  try {
    const users = await User.find({ company: req.user.company._id })
      .select("name email role isActive createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch company users." });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ message: "Title and PDF file are required." });
    }

    const document = await Document.create({
      title: title.trim(),
      company: req.user.company._id,
      uploadedBy: req.user._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    return res.status(201).json({ message: "Document uploaded successfully.", document });
  } catch (error) {
    return res.status(500).json({ message: "Failed to upload document.", error: error.message });
  }
};

export const getCompanyDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ company: req.user.company._id })
      .populate("uploadedBy", "name email role")
      .populate("workflow", "name status")
      .sort({ createdAt: -1 });

    return res.status(200).json({ documents });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch company documents." });
  }
};

export const createWorkflow = async (req, res) => {
  try {
    const { name, documentId, steps } = req.body;

    if (!name || !documentId || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ message: "Workflow name, documentId and steps are required." });
    }

    const document = await Document.findOne({ _id: documentId, company: req.user.company._id });
    if (!document) {
      return res.status(404).json({ message: "Document not found for this company." });
    }

    const existingWorkflow = await Workflow.findOne({ document: document._id });
    if (existingWorkflow) {
      return res.status(409).json({ message: "Workflow already exists for this document." });
    }

    const sortedSteps = [...steps].sort((a, b) => Number(a.order) - Number(b.order));

    const userIds = sortedSteps.map((item) => item.userId);
    const users = await User.find({
      _id: { $in: userIds },
      company: req.user.company._id,
      isActive: true,
    });

    if (users.length !== userIds.length) {
      return res.status(400).json({ message: "One or more workflow users are invalid." });
    }

    const workflowSteps = sortedSteps.map((item, index) => ({
      order: Number(item.order) || index + 1,
      user: item.userId,
      status: index === 0 ? "pending" : "waiting",
    }));

    const workflow = await Workflow.create({
      name: name.trim(),
      company: req.user.company._id,
      document: document._id,
      createdBy: req.user._id,
      steps: workflowSteps,
      status: "in_progress",
    });

    document.workflow = workflow._id;
    document.status = "in_progress";
    document.currentStep = 1;
    document.totalSteps = workflowSteps.length;
    await document.save();

    const populatedWorkflow = await Workflow.findById(workflow._id)
      .populate("document", "title")
      .populate("steps.user", "name email role");

    return res.status(201).json({ message: "Workflow created successfully.", workflow: populatedWorkflow });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create workflow.", error: error.message });
  }
};

export const getCompanyWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find({ company: req.user.company._id })
      .populate("document", "title status")
      .populate("steps.user", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ workflows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch workflows." });
  }
};

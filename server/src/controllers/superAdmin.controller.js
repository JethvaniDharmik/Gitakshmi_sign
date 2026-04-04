import { Company } from "../models/company.model.js";
import { Document } from "../models/document.model.js";
import { User } from "../models/user.model.js";
import { Workflow } from "../models/workflow.model.js";
import { ROLES } from "../constants/roles.js";

export const createCompany = async (req, res) => {
  try {
    const { name, domain, adminName, adminEmail, adminPassword } = req.body;

    if (!name || !adminEmail || !adminPassword) {
      return res.status(400).json({
        message: "Company name, admin email and admin password are required.",
      });
    }

    const cleanCompanyName = String(name).trim();
    const cleanDomain = domain ? String(domain).trim().toLowerCase() : null;
    const cleanAdminName = String(adminName || "Company Admin").trim();
    const cleanAdminEmail = String(adminEmail).trim().toLowerCase();
    const cleanAdminPassword = String(adminPassword);

    if (cleanAdminPassword.length < 8) {
      return res.status(400).json({ message: "Admin password must be at least 8 characters." });
    }

    const existing = await Company.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Company already exists." });
    }

    const existingAdminEmail = await User.findOne({ email: cleanAdminEmail });
    if (existingAdminEmail) {
      return res.status(409).json({ message: "Admin email already exists." });
    }

    const company = await Company.create({
      name: cleanCompanyName,
      domain: cleanDomain,
      createdBy: req.user._id,
    });

    try {
      const adminUser = await User.create({
        name: cleanAdminName,
        email: cleanAdminEmail,
        password: cleanAdminPassword,
        role: ROLES.ADMIN,
        companyId: company._id,
        company: company._id,
      });

      return res.status(201).json({
        message: "Company and admin user created successfully.",
        company,
        adminUser: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          companyId: adminUser.companyId,
        },
      });
    } catch (adminCreateError) {
      await Company.deleteOne({ _id: company._id });
      return res
        .status(500)
        .json({ message: "Company created but admin creation failed. Rolled back.", error: adminCreateError.message });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to create company.", error: error.message });
  }
};

export const getCompanies = async (_req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    return res.status(200).json({ companies });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch companies." });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { name, domain, isActive } = req.body;

    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found." });
    }

    if (name !== undefined) {
      company.name = String(name).trim();
    }

    if (domain !== undefined) {
      company.domain = domain ? String(domain).trim().toLowerCase() : null;
    }

    if (isActive !== undefined) {
      company.isActive = Boolean(isActive);

      if (!company.isActive) {
        await User.updateMany(
          {
            company: company._id,
            role: { $ne: ROLES.SUPER_ADMIN },
          },
          { $set: { isActive: false } }
        );
      }
    }

    await company.save();

    return res.status(200).json({ message: "Company updated successfully.", company });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update company.", error: error.message });
  }
};

export const getAllUsers = async (_req, res) => {
  try {
    const users = await User.find()
      .populate("company", "name")
      .select("name email role isActive company createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch users." });
  }
};

export const getAllDocuments = async (_req, res) => {
  try {
    const documents = await Document.find()
      .populate("company", "name")
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 });

    const workflows = await Workflow.find()
      .populate("document", "title")
      .populate("company", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ documents, workflows });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch platform documents." });
  }
};

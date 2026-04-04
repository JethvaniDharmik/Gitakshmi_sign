import { useEffect, useMemo, useState } from "react";
import MetricCard from "../components/dashboard/MetricCard";
import StatusBadge from "../components/dashboard/StatusBadge";
import TablePanel from "../components/dashboard/TablePanel";
import DashboardLayout from "../components/layout/DashboardLayout";
import { companyAdminApi, dmsApi } from "../services/api";

const parseSignerRows = (rawText) => {
  const lines = String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index) => {
    const [emailPart, orderPart] = line.split(",").map((item) => item.trim());
    return {
      email: String(emailPart || "").toLowerCase(),
      signingOrder: Number(orderPart || index + 1),
    };
  });
};

const CompanyAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    expiryDate: "",
    storage: "local",
    reminderIntervalHours: 24,
    file: null,
  });

  const [savingSigners, setSavingSigners] = useState(false);
  const [signerForm, setSignerForm] = useState({
    documentId: "",
    signerRows: "",
  });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });

  const [runningReminders, setRunningReminders] = useState(false);
  const [startingDocId, setStartingDocId] = useState("");

  const loadData = async () => {
    const [docsRes, usersRes] = await Promise.all([dmsApi.getDocuments(), companyAdminApi.getUsers()]);
    setDocuments(docsRes.data.documents || []);
    setUsers(usersRes.data.users || []);
  };

  useEffect(() => {
    loadData().catch(() => setError("Unable to load company dashboard data."));
  }, []);

  const pendingSignatures = useMemo(
    () =>
      documents.reduce((acc, doc) => {
        const pendingInDoc = (doc.signers || []).filter((signer) => ["pending", "viewed"].includes(signer.status)).length;
        return acc + pendingInDoc;
      }, 0),
    [documents]
  );

  const completedDocuments = useMemo(
    () => documents.filter((doc) => doc.status === "completed").length,
    [documents]
  );

  const stats = [
    { title: "Documents Created", value: documents.length, hint: "Uploaded by your company" },
    { title: "Pending Signatures", value: pendingSignatures, hint: "Across all signer queues" },
    { title: "Completed Documents", value: completedDocuments, hint: "Fully signed and locked" },
  ];

  const flowProgress = useMemo(() => {
    const hasUsers = users.length > 0;
    const hasDocuments = documents.length > 0;
    const hasSignerConfigured = documents.some((doc) => (doc.signers?.length || 0) > 0);
    const hasStartedFlow = documents.some((doc) => ["signed", "completed", "in_progress"].includes(doc.status));
    return { hasUsers, hasDocuments, hasSignerConfigured, hasStartedFlow };
  }, [users, documents]);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      setError("Name, email, password જરૂરી છે.");
      return;
    }

    try {
      setCreatingUser(true);
      await companyAdminApi.createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        role: userForm.role,
      });
      setUserForm({ name: "", email: "", password: "", role: "employee" });
      setMessage("User created successfully. Access આપી દેવામાં આવ્યું.");
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Failed to create user.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!uploadForm.title.trim() || !uploadForm.file) {
      setError("Document title and PDF file are required.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("title", uploadForm.title.trim());
      formData.append("description", uploadForm.description.trim());
      formData.append("storage", uploadForm.storage);
      formData.append("reminderIntervalHours", String(uploadForm.reminderIntervalHours || 24));
      if (uploadForm.expiryDate) {
        formData.append("expiryDate", uploadForm.expiryDate);
      }
      formData.append("document", uploadForm.file);

      await dmsApi.uploadDocument(formData);
      setUploadForm({
        title: "",
        description: "",
        expiryDate: "",
        storage: "local",
        reminderIntervalHours: 24,
        file: null,
      });
      setMessage("Document uploaded successfully.");
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSigners = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!signerForm.documentId) {
      setError("Please select a document.");
      return;
    }

    const signers = parseSignerRows(signerForm.signerRows).filter((item) => item.email);
    if (!signers.length) {
      setError("Add at least one signer row. Format: email,order");
      return;
    }

    try {
      setSavingSigners(true);
      await dmsApi.addSigners(signerForm.documentId, { signers });
      setSignerForm({ documentId: "", signerRows: "" });
      setMessage("Signers saved successfully.");
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Failed to save signers.");
    } finally {
      setSavingSigners(false);
    }
  };

  const handleStartSigning = async (documentId) => {
    setError("");
    setMessage("");
    try {
      setStartingDocId(documentId);
      await dmsApi.startSigningFlow(documentId);
      setMessage("Signing flow started. First signer email sent.");
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Failed to start signing flow.");
    } finally {
      setStartingDocId("");
    }
  };

  const handleRunReminders = async () => {
    setError("");
    setMessage("");
    try {
      setRunningReminders(true);
      const { data } = await dmsApi.runReminders();
      setMessage(`Reminder job done. Sent: ${data?.remindersSent || 0}, Skipped: ${data?.skipped || 0}`);
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Failed to run reminders.");
    } finally {
      setRunningReminders(false);
    }
  };

  const documentRows = documents.slice(0, 20).map((doc) => ({
    id: doc._id,
    documentId: doc._id,
    title: doc.title,
    status: doc.status,
    signersCount: doc.signers?.length || 0,
    step: doc.currentStep && doc.totalSteps ? `${doc.currentStep}/${doc.totalSteps}` : "-",
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : "-",
    isLocked: doc.isLocked,
  }));

  return (
    <DashboardLayout title="Company Dashboard" subtitle="Upload documents, configure signers, and run the signing workflow">
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <MetricCard key={item.title} title={item.title} value={item.value} hint={item.hint} />
        ))}
      </section>

      {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <section className="sf-card mt-6 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Step-by-Step Flow</h2>
        <p className="mt-1 text-sm text-slate-500">આ order પ્રમાણે કરશો તો flow smooth રહેશે.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Step 1: Create Team Users</p>
            <p className="text-xs text-slate-500">HR / Employee / Admin access બનાવો.</p>
            <p className="mt-1 text-xs">{flowProgress.hasUsers ? "✅ Done" : "⏳ Pending"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Step 2: Upload Document</p>
            <p className="text-xs text-slate-500">PDF upload કરીને expiry/reminder set કરો.</p>
            <p className="mt-1 text-xs">{flowProgress.hasDocuments ? "✅ Done" : "⏳ Pending"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Step 3: Add Signers</p>
            <p className="text-xs text-slate-500">Signer email + signing order define કરો.</p>
            <p className="mt-1 text-xs">{flowProgress.hasSignerConfigured ? "✅ Done" : "⏳ Pending"}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Step 4: Start Signing Flow</p>
            <p className="text-xs text-slate-500">First signer ને email auto જાશે.</p>
            <p className="mt-1 text-xs">{flowProgress.hasStartedFlow ? "✅ Done" : "⏳ Pending"}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleCreateUser} className="sf-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">Step 1: Create User Access</h2>
          <p className="mt-1 text-sm text-slate-500">નવા user ને login access આપો.</p>

          <div className="mt-4 space-y-3">
            <input
              value={userForm.name}
              onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              className="sf-input"
              required
            />
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              className="sf-input"
              required
            />
            <input
              type="password"
              value={userForm.password}
              onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password (min 8 chars)"
              className="sf-input"
              required
            />
            <select
              value={userForm.role}
              onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
              className="sf-input"
            >
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={creatingUser} className="sf-btn-primary w-full">
              {creatingUser ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>

        <div className="sf-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">Current Team Users</h2>
          <p className="mt-1 text-sm text-slate-500">આ users company access સાથે login કરી શકે છે.</p>
          <div className="mt-4 space-y-2">
            {users.length ? (
              users.slice(0, 12).map((user) => (
                <div key={user._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                  <StatusBadge status={user.role} />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No users created yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <form onSubmit={handleUpload} className="sf-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">Step 2: Upload Document</h2>
          <p className="mt-1 text-sm text-slate-500">Add PDF with expiry, storage, and reminder settings.</p>

          <div className="mt-4 space-y-3">
            <input
              value={uploadForm.title}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Document title"
              className="sf-input"
              required
            />
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Description"
              className="sf-input min-h-[90px]"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="date"
                value={uploadForm.expiryDate}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, expiryDate: e.target.value }))}
                className="sf-input"
              />
              <select
                value={uploadForm.storage}
                onChange={(e) => setUploadForm((prev) => ({ ...prev, storage: e.target.value }))}
                className="sf-input"
              >
                <option value="local">Local storage</option>
                <option value="cloudinary">Cloudinary</option>
              </select>
            </div>
            <input
              type="number"
              min={1}
              value={uploadForm.reminderIntervalHours}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, reminderIntervalHours: Number(e.target.value || 24) }))}
              placeholder="Reminder interval (hours)"
              className="sf-input"
            />
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setUploadForm((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
              className="sf-input"
              required
            />
            <button type="submit" disabled={uploading} className="sf-btn-primary w-full">
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>

        <form onSubmit={handleSaveSigners} className="sf-card p-5">
          <h2 className="text-lg font-semibold text-slate-900">Step 3: Add Signers</h2>
          <p className="mt-1 text-sm text-slate-500">Format per line: email,order (example: user@mail.com,1)</p>

          <div className="mt-4 space-y-3">
            <select
              value={signerForm.documentId}
              onChange={(e) => setSignerForm((prev) => ({ ...prev, documentId: e.target.value }))}
              className="sf-input"
              required
            >
              <option value="">Select document</option>
              {documents.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.title}
                </option>
              ))}
            </select>
            <textarea
              value={signerForm.signerRows}
              onChange={(e) => setSignerForm((prev) => ({ ...prev, signerRows: e.target.value }))}
              placeholder={"first@mail.com,1\nsecond@mail.com,2"}
              className="sf-input min-h-[170px] font-mono text-xs"
              required
            />
            <div className="grid gap-2 md:grid-cols-2">
              <button type="submit" disabled={savingSigners} className="sf-btn-primary w-full">
                {savingSigners ? "Saving..." : "Save Signers"}
              </button>
              <button type="button" disabled={runningReminders} onClick={handleRunReminders} className="sf-btn-secondary w-full">
                {runningReminders ? "Running..." : "Run Reminders"}
              </button>
            </div>
          </div>
        </form>
      </section>

      <div className="mt-6">
        <TablePanel
          title="Step 4: Start Signing & Track Progress"
          subtitle="Start flow, monitor status, and download signed PDF"
          emptyLabel="No company documents found."
          columns={[
            { key: "title", label: "Document" },
            { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
            { key: "signersCount", label: "Signers" },
            { key: "step", label: "Step" },
            { key: "updatedAt", label: "Updated" },
            {
              key: "actions",
              label: "Actions",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartSigning(row.documentId)}
                    disabled={startingDocId === row.documentId || row.isLocked || row.status === "completed"}
                    className="sf-btn-primary px-3 py-1.5 text-xs"
                  >
                    {startingDocId === row.documentId ? "Starting..." : "Start"}
                  </button>
                  {(row.status === "completed" || row.isLocked) ? (
                    <a
                      className="sf-btn-secondary px-3 py-1.5 text-xs"
                      href={dmsApi.signedPdfUrl(row.documentId)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Signed PDF
                    </a>
                  ) : null}
                </div>
              ),
            },
          ]}
          rows={documentRows}
        />
      </div>
    </DashboardLayout>
  );
};

export default CompanyAdminDashboard;

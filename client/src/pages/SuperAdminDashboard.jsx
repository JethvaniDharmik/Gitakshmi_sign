import { useEffect, useMemo, useState } from "react";
import MetricCard from "../components/dashboard/MetricCard";
import StatusBadge from "../components/dashboard/StatusBadge";
import TablePanel from "../components/dashboard/TablePanel";
import DashboardLayout from "../components/layout/DashboardLayout";
import { superAdminApi } from "../services/api";

const SuperAdminDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [companyForm, setCompanyForm] = useState({
    name: "",
    domain: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [savingCompany, setSavingCompany] = useState(false);
  const [togglingId, setTogglingId] = useState("");

  const loadData = async () => {
    try {
      const [companiesRes, usersRes, docsRes] = await Promise.all([
        superAdminApi.getCompanies(),
        superAdminApi.getUsers(),
        superAdminApi.getDocuments(),
      ]);

      setCompanies(companiesRes.data.companies || []);
      setUsers(usersRes.data.users || []);
      setDocuments(docsRes.data.documents || []);
    } catch {
      setError("Unable to load dashboard data right now.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(
    () => [
      { title: "Total Companies", value: companies.length, hint: "Active and inactive tenants" },
      { title: "Total Users", value: users.length, hint: "All platform accounts" },
      { title: "Total Documents", value: documents.length, hint: "Across all companies" },
    ],
    [companies.length, users.length, documents.length]
  );

  const companyRows = companies.slice(0, 12).map((company) => ({
    id: company._id,
    name: company.name,
    domain: company.domain || "-",
    status: company.isActive ? "active" : "inactive",
    createdAt: company.createdAt ? new Date(company.createdAt).toLocaleDateString() : "-",
    isActive: company.isActive,
  }));

  const documentRows = documents.slice(0, 12).map((doc) => ({
    id: doc._id,
    title: doc.title,
    company: doc.company?.name || "-",
    owner: doc.uploadedBy?.name || "-",
    status: doc.status,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : "-",
  }));

  const handleCreateCompany = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!companyForm.name.trim() || !companyForm.adminEmail.trim() || !companyForm.adminPassword.trim()) {
      setError("Company name, admin email and admin password are required.");
      return;
    }

    try {
      setSavingCompany(true);
      const { data } = await superAdminApi.createCompany({
        name: companyForm.name.trim(),
        domain: companyForm.domain.trim() || undefined,
        adminName: companyForm.adminName.trim() || "Company Admin",
        adminEmail: companyForm.adminEmail.trim(),
        adminPassword: companyForm.adminPassword,
      });
      setCompanyForm({ name: "", domain: "", adminName: "", adminEmail: "", adminPassword: "" });
      setMessage(
        `Company created. Admin login: ${data?.adminUser?.email || companyForm.adminEmail.trim()}`
      );
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Failed to create company.");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleToggleCompany = async (row) => {
    try {
      setTogglingId(row.id);
      setMessage("");
      setError("");
      await superAdminApi.updateCompany(row.id, { isActive: !row.isActive });
      setMessage(`Company ${row.isActive ? "disabled" : "enabled"} successfully.`);
      await loadData();
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Failed to update company.");
    } finally {
      setTogglingId("");
    }
  };

  return (
    <DashboardLayout title="Super Admin Dashboard" subtitle="Global visibility across tenants and document operations">
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => (
          <MetricCard key={item.title} title={item.title} value={item.value} hint={item.hint} />
        ))}
      </section>

      {error ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}

      <section className="sf-card mt-6 p-4 md:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Create Company</h2>
        <p className="mt-1 text-sm text-slate-500">Add a new organization to the SignFlow platform.</p>

        <form onSubmit={handleCreateCompany} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={companyForm.name}
            onChange={(e) => setCompanyForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Company name"
            className="sf-input"
            required
          />
          <input
            value={companyForm.domain}
            onChange={(e) => setCompanyForm((prev) => ({ ...prev, domain: e.target.value }))}
            placeholder="Domain (optional)"
            className="sf-input"
          />
          <input
            value={companyForm.adminName}
            onChange={(e) => setCompanyForm((prev) => ({ ...prev, adminName: e.target.value }))}
            placeholder="Admin name (optional)"
            className="sf-input"
          />
          <input
            type="email"
            value={companyForm.adminEmail}
            onChange={(e) => setCompanyForm((prev) => ({ ...prev, adminEmail: e.target.value }))}
            placeholder="Admin email"
            className="sf-input"
            required
          />
          <input
            type="password"
            value={companyForm.adminPassword}
            onChange={(e) => setCompanyForm((prev) => ({ ...prev, adminPassword: e.target.value }))}
            placeholder="Admin password (min 8 chars)"
            className="sf-input md:col-span-2"
            required
          />
          <button type="submit" disabled={savingCompany} className="sf-btn-primary md:w-fit">
            {savingCompany ? "Creating..." : "Create Company"}
          </button>
        </form>
      </section>

      <div className="mt-6">
        <TablePanel
          title="Companies"
          subtitle="Manage company activation status"
          emptyLabel="No companies created yet."
          columns={[
            { key: "name", label: "Name" },
            { key: "domain", label: "Domain" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
            { key: "createdAt", label: "Created" },
            {
              key: "action",
              label: "Action",
              render: (row) => (
                <button
                  type="button"
                  onClick={() => handleToggleCompany(row)}
                  disabled={togglingId === row.id}
                  className="sf-btn-secondary px-3 py-1.5 text-xs"
                >
                  {togglingId === row.id ? "Updating..." : row.isActive ? "Disable" : "Enable"}
                </button>
              ),
            },
          ]}
          rows={companyRows}
        />
      </div>

      <div className="mt-6">
        <TablePanel
          title="Recent Documents"
          subtitle="Latest updates across organizations"
          emptyLabel="No documents found yet."
          columns={[
            { key: "title", label: "Document" },
            { key: "company", label: "Company" },
            { key: "owner", label: "Owner" },
            {
              key: "status",
              label: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
            { key: "updatedAt", label: "Updated" },
          ]}
          rows={documentRows}
        />
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;

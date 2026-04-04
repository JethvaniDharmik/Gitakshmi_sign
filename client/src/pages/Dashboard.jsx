import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardFilters from "../components/dashboard/DashboardFilters";
import DocumentsChart from "../components/dashboard/DocumentsChart";
import DocumentsTable from "../components/dashboard/DocumentsTable";
import RecentActivity from "../components/dashboard/RecentActivity";
import StatCard from "../components/dashboard/StatCard";
import { documentApi } from "../services/api";

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const RejectedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="m9 9 6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const actionSortWeight = {
  DOCUMENT_SIGNED: 3,
  DOCUMENT_VIEWED: 2,
  SIGN_REQUEST_SENT: 1,
  DOCUMENT_UPLOADED: 0,
};

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const loadDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await documentApi.list();
      const docs = data.documents || [];
      setDocuments(docs);

      const auditRequests = docs.slice(0, 8).map((doc) => documentApi.audit(doc._id));
      const auditResponses = await Promise.allSettled(auditRequests);
      const parsedActivities = auditResponses
        .filter((item) => item.status === "fulfilled")
        .flatMap((item) => item.value.data.logs || [])
        .map((log) => ({
          id: log._id,
          action: log.action,
          createdAt: log.createdAt,
          title: log.documentTitle || docs.find((doc) => doc._id === log.document)?.title || "Document",
        }))
        .sort((a, b) => {
          const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (timeDiff !== 0) return timeDiff;
          return (actionSortWeight[b.action] || 0) - (actionSortWeight[a.action] || 0);
        })
        .slice(0, 8);

      setActivities(parsedActivities);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const queryMatch = doc.title.toLowerCase().includes(query.trim().toLowerCase());
      const statusMatch = statusFilter === "all" ? true : doc.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [documents, query, statusFilter]);

  const stats = useMemo(() => {
    const total = documents.length;
    const signed = documents.filter((doc) => doc.status === "Signed").length;
    const rejected = documents.filter((doc) => doc.status === "Rejected").length;
    const pending = documents.filter((doc) => doc.status !== "Signed" && doc.status !== "Rejected").length;
    return { total, signed, pending, rejected };
  }, [documents]);

  const chartSeries = useMemo(() => {
    const labels = [...Array(7)].map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date;
    });

    return labels.map((date) => {
      const label = date.toLocaleDateString(undefined, { weekday: "short" });
      const key = date.toISOString().slice(0, 10);
      const count = documents.filter((doc) => doc.createdAt.slice(0, 10) === key).length;
      return { label, count };
    });
  }, [documents]);

  const handleView = (doc) => {
    window.open(documentApi.fileUrl(doc._id), "_blank", "noopener,noreferrer");
  };

  const handleDownload = (doc) => {
    const link = document.createElement("a");
    link.href = documentApi.fileUrl(doc._id);
    link.download = `${doc.title || "document"}.pdf`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const handleDelete = async (doc) => {
    const confirmed = window.confirm(`Delete "${doc.title}"? This cannot be undone.`);
    if (!confirmed) return;
    setDeletingId(doc._id);
    try {
      await documentApi.remove(doc._id);
      setDocuments((prev) => prev.filter((item) => item._id !== doc._id));
      setActivities((prev) => prev.filter((item) => item.title !== doc.title));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete document.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-blue-50 p-5 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">GitakshmiSign Dashboard</h1>
            <p className="mt-0.5 text-sm text-slate-600">Monitor documents, signatures, activity, and performance in one place.</p>
          </div>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500"
          >
            <PlusIcon />
            Upload New
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Documents" value={stats.total} hint="All uploaded files" icon={<FileIcon />} tone="indigo" />
        <StatCard title="Signed Documents" value={stats.signed} hint="Completed signatures" icon={<CheckIcon />} tone="emerald" />
        <StatCard title="Pending Documents" value={stats.pending} hint="Awaiting completion" icon={<ClockIcon />} tone="amber" />
        <StatCard title="Rejected Documents" value={stats.rejected} hint="Declined requests" icon={<RejectedIcon />} tone="rose" />
      </div>

      <DashboardFilters query={query} onQueryChange={setQuery} status={statusFilter} onStatusChange={setStatusFilter} />

      {loading && <p className="text-sm text-slate-500">Loading documents...</p>}
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <DocumentsTable
            documents={filteredDocuments}
            deletingId={deletingId}
            onView={handleView}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
          <DocumentsChart series={chartSeries} />
        </div>
        <RecentActivity items={activities} />
      </div>
    </section>
  );
};

export default Dashboard;

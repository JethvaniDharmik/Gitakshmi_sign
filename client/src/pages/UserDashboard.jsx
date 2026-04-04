import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MetricCard from "../components/dashboard/MetricCard";
import StatusBadge from "../components/dashboard/StatusBadge";
import TablePanel from "../components/dashboard/TablePanel";
import DashboardLayout from "../components/layout/DashboardLayout";
import { userApi } from "../services/api";

const UserDashboard = () => {
  const [assignedDocs, setAssignedDocs] = useState([]);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    const { data } = await userApi.getAssignedDocuments();
    setAssignedDocs(data.assignedDocuments || []);
  };

  useEffect(() => {
    loadData().catch(() => setMessage("Failed to load assigned documents."));
  }, []);

  const pendingCount = useMemo(
    () => assignedDocs.filter((item) => item.myStep?.status === "pending").length,
    [assignedDocs]
  );

  const completedCount = useMemo(
    () => assignedDocs.filter((item) => item.myStep?.status === "signed").length,
    [assignedDocs]
  );

  const tableRows = assignedDocs.map((item) => ({
    id: item.workflowId,
    documentId: item.document._id,
    title: item.document.title,
    workflow: item.workflowName,
    documentStatus: item.document.status,
    myStatus: item.myStep?.status || "-",
  }));

  return (
    <DashboardLayout title="My Documents" subtitle="Review assigned documents and complete signing tasks">
      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Assigned Documents" value={assignedDocs.length} hint="Documents routed to you" />
        <MetricCard title="Pending Signatures" value={pendingCount} hint="Awaiting your action" />
        <MetricCard title="Completed Signatures" value={completedCount} hint="Signed by you" />
      </section>

      {message ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p> : null}

      <div className="mt-6">
        <TablePanel
          title="Assigned Documents"
          subtitle="Open workspace to place fields and sign"
          emptyLabel="No assigned documents yet."
          columns={[
            { key: "title", label: "Document" },
            { key: "workflow", label: "Workflow" },
            { key: "myStatus", label: "My Status", render: (row) => <StatusBadge status={row.myStatus} /> },
            {
              key: "documentStatus",
              label: "Document Status",
              render: (row) => <StatusBadge status={row.documentStatus} />,
            },
            {
              key: "action",
              label: "Action",
              render: (row) => (
                <Link
                  to={`/my-documents/${row.documentId}/sign`}
                  className={`inline-flex rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    row.myStatus === "pending"
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                  onClick={(event) => {
                    if (row.myStatus !== "pending") event.preventDefault();
                  }}
                >
                  Open Workspace
                </Link>
              ),
            },
          ]}
          rows={tableRows}
        />
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
